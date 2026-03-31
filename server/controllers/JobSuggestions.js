import axios from "axios";
import JobCache from "../models/JobCache.js";
import redisClient from "../config/redis.js";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const rapidHeaders = {
    "X-RapidAPI-Key": process.env.RAPID_API_KEY,
};

/**
 * JSearch (RapidAPI) — aggregates Indeed, LinkedIn, Glassdoor, etc.
 * Fetches pages 1, 2, 3 in parallel for up to 30 results.
 * NOTE: "country" is NOT a valid param — omit it or results will be empty.
 */
async function fetchJSearch(query) {
    const pages = ["1", "2", "3"];

    const responses = await Promise.allSettled(
        pages.map((page) =>
            axios.get("https://jsearch.p.rapidapi.com/search", {
                params: { query, page, num_pages: "1" },
                headers: {
                    ...rapidHeaders,
                    "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
                },
                timeout: 10000,
            })
        )
    );

    const results = [];
    for (const res of responses) {
        if (res.status === "rejected") {
            console.warn("[JSearch] page failed:", res.reason?.response?.data?.message || res.reason?.message);
            continue;
        }
        const jobs = res.value.data?.data;
        if (!Array.isArray(jobs)) continue;

        for (const job of jobs) {
            results.push({
                title: job.job_title || "N/A",
                company: job.employer_name || "",
                location: [job.job_city, job.job_country].filter(Boolean).join(", "),
                salary: job.job_min_salary
                    ? `₹${job.job_min_salary}–${job.job_max_salary ?? "?"}`
                    : job.job_salary || "Not Disclosed",
                link: job.job_apply_link || "#",
                source: "JSearch",
            });
        }
    }

    return results;
}

/**
 * LinkedIn Jobs Search via RapidAPI (linkedin-job-search-api).
 * Returns [] silently if not subscribed.
 */
async function fetchLinkedIn(description, experience) {
    try {
        const res = await axios.get(
            "https://linkedin-job-search-api.p.rapidapi.com/active-jb-24h",
            {
                params: {
                    title_filter: `"${description}"`,
                    location_filter: '"India"',
                    count: "20",
                },
                headers: {
                    ...rapidHeaders,
                    "X-RapidAPI-Host": "linkedin-job-search-api.p.rapidapi.com",
                },
                timeout: 10000,
            }
        );

        const items = Array.isArray(res.data) ? res.data : [];
        return items.map((job) => ({
            title: job.title || "N/A",
            company: job.organization || job.company || "",
            location: job.location || "India",
            salary: job.salary || "Not Disclosed",
            link: job.url || job.linkedin_url || "#",
            source: "LinkedIn",
        }));
    } catch (err) {
        console.warn("[LinkedIn] fetch failed:", err?.response?.data?.message || err.message);
        return [];
    }
}

/**
 * Unstop — public internal search API (no key needed).
 */
async function fetchUnstop(query, experience) {
    try {
        const expMap = {
            Fresher: "0,1",
            "1-2 Years": "1,2",
            "3-5 Years": "3,5",
            "5+ Years": "5,30",
        };
        const expRange = expMap[experience] || "0,30";

        const res = await axios.get(
            "https://unstop.com/api/public/opportunity/search-new",
            {
                params: {
                    opportunity: "jobs",
                    per_page: 20,
                    oppstatus: "open",
                    searchTerm: query,
                    experience: expRange,
                },
                headers: {
                    Accept: "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    Referer: "https://unstop.com/jobs",
                },
                timeout: 10000,
            }
        );

        const items = res.data?.data?.data ?? [];
        return items.map((item) => {
            const org = item.organisation?.name || item.company_name || "Unknown Company";
            const city = item.office_location?.[0]?.city || item.city || "India";
            const min = item.salary_min ? `₹${item.salary_min}` : null;
            const max = item.salary_max ? `₹${item.salary_max}` : null;
            const salary = min ? `${min}${max ? "–" + max : "+"}` : "Not Disclosed";

            return {
                title: item.title || item.job_title || "N/A",
                company: org,
                location: city,
                salary,
                link: `https://unstop.com/${item.public_url || "jobs"}`,
                source: "Unstop",
            };
        });
    } catch (err) {
        console.warn("[Unstop] fetch failed:", err?.response?.data?.message || err.message);
        return [];
    }
}

// ─────────────────────────────────────────────
// Fair round-robin merge — interleaves results
// from each source so none is cut off by the cap
// ─────────────────────────────────────────────
function fairMerge(sources, cap = 45) {
    const seen = new Set();
    const result = [];
    const max = Math.max(...sources.map((s) => s.length));

    for (let i = 0; i < max && result.length < cap; i++) {
        for (const source of sources) {
            if (i >= source.length) continue;
            const job = source[i];
            const key = `${job.title?.toLowerCase().trim()}_${job.company?.toLowerCase().trim()}`;
            if (seen.has(key)) continue;
            seen.add(key);
            result.push(job);
            if (result.length >= cap) break;
        }
    }

    return result;
}

// ─────────────────────────────────────────────
// Build a normalised cache key from the request
// ─────────────────────────────────────────────
function buildCacheKey(description, skills, experience) {
    return [description, skills, experience]
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
        .join("|");
}

// ─────────────────────────────────────────────
// Controller
// ─────────────────────────────────────────────
export const generateJobSuggestions = async (req, res) => {
    const { description = "", skills = "", experience = "Fresher" } = req.body;

    const query=[description,skills,experience]
        .filter(Boolean)
        .join("|")
        .toLowerCase()
        .trim();

    const redisKey=`jobs:${query}`;
    


    const cacheKey = buildCacheKey(description, skills, experience);
    const queryForAPIs = [description, skills, "India"].filter(Boolean).join(" ");

    try {

        const cachedRedis = await redisClient.get(redisKey);
if (cachedRedis) {
    console.log("Returning from Redis");
    return res.json(JSON.parse(cachedRedis));
}

        // ── 1. Check cache ──────────────────────────────────────────
        const cached = await JobCache.findOne({ query: cacheKey });
if (cached) {
    console.log("Mongo Cache HIT");

    await redisClient.setEx(
        redisKey,
        21600,
        JSON.stringify(cached.jobs)
    );

    return res.json(cached.jobs);
}

        const [jsearchJobs, linkedInJobs, unstopJobs] = await Promise.all([
    fetchJSearch(queryForAPIs),
    fetchLinkedIn(description, experience),
    fetchUnstop(description, experience),
]);

const final = fairMerge([jsearchJobs, linkedInJobs, unstopJobs], 45);

// 4️⃣ Save Mongo
await JobCache.create({ query: cacheKey, jobs: final });

// 5️⃣ Save Redis
await redisClient.setEx(
    redisKey,
    21600,
    JSON.stringify(final)
);

        // ── 4. Save to cache (expires after 12 h via TTL index) ─────
        if (final.length > 0) {
            try {
                // Delete stale entry first (in case previous run cached bad data)
                await JobCache.deleteOne({ query: cacheKey });
                await JobCache.create({ query: cacheKey, jobs: final });
                console.log(`[JobSuggestions] Cached ${final.length} jobs for "${cacheKey}"`);
            } catch (cacheErr) {
                if (cacheErr.code !== 11000) {
                    console.warn("[JobSuggestions] Cache write failed:", cacheErr.message);
                }
            }
        }

        res.json(final);

    } catch (error) {
        console.error("[JobSuggestions] Unexpected error:", error.message);
        res.status(500).json({ message: "Error fetching jobs" });
    }
};

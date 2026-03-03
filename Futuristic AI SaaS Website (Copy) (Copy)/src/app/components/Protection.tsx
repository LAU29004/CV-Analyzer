import { useAuth } from "../context/AuthContext";

interface Props {
  children: () => void;
}

const ProtectedAction = ({ children }: Props) => {
  const { user } = useAuth();

  if (!user) {
    alert("Please login to access this feature");
    return null;
  }

  return <button onClick={children}>Run Feature</button>;
};

export default ProtectedAction;

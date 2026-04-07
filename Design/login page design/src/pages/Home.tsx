import "./Home.css";
import Logo from "../components/Logo";
import { useNavigate } from "react-router-dom";

type CardProps = {
  title: string;
  description: string;
};

// ✅ UPDATED CARD
const Card = ({ title, description }: CardProps) => {
  const navigate = useNavigate();

 const handleClick = () => {
  if (!title) return;  // safety check

  const role = title.split(" ")[0]?.toLowerCase();
  navigate(`/login/${role}`);
};

  return (
    <div className="card">
      <div className="icon">👤</div>
      <h3>{title}</h3>
      <p>{description}</p>
      <button onClick={handleClick}>Login Now</button>
    </div>
  );
};

const Home = () => {
  return (
    <div className="home-container">
      <Logo />

      <div className="card-container">
        <Card title="Intern Login" description="" />
        <Card title="Trainer Login" description="" />
        <Card title="Admin Login" description="" />
      </div>
    </div>
  );
};

export default Home;
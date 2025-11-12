import { Player } from "@lottiefiles/react-lottie-player";
import DashboardAnimation from "@/app/assets/animations/dashboard.json"; // Make sure the path is correct

const DashboardIcon = () => {
  return (
    <Player
      autoplay
      loop
      src={DashboardAnimation}
      style={{ width: 70, height: 70, marginTop: -20, marginBottom: -20}} // Adjust size as needed
    />
  );
};

export default DashboardIcon;

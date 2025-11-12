import { Player } from "@lottiefiles/react-lottie-player";
import BookOpenAnimation from "@/app/assets/animations/wallet.json"; // Make sure the path is correct

const WalletIcon = () => {
  return (
    <Player
      autoplay
      loop
      src={BookOpenAnimation}
      style={{ width: 130, height: 130, marginTop: -30, marginBottom: -50, marginLeft: -30, marginRight: -30}} // Adjust size as needed
    />
  );
};

export default WalletIcon;

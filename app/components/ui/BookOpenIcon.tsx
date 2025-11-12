import { Player } from "@lottiefiles/react-lottie-player";
import BookOpenAnimation from "@/app/assets/animations/openbook.json"; // Make sure the path is correct

const BookOpenIcon = () => {
  return (
    <Player
      autoplay
      loop
      src={BookOpenAnimation}
      style={{ width: 90, height: 90, marginTop: -30, marginBottom: -30, marginLeft: -30, marginRight: -30}} // Adjust size as needed
    />
  );
};

export default BookOpenIcon;

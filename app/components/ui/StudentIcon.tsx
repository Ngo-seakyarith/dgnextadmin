import { Player } from "@lottiefiles/react-lottie-player";
import BookOpenAnimation from "@/app/assets/animations/student.json"; // Make sure the path is correct

const StudentIcon = () => {
  return (
    <Player
      autoplay
      loop
      src={BookOpenAnimation}
      style={{ width: 60, height: 60, marginTop: -0}} // Adjust size as needed
    />
  );
};

export default StudentIcon;

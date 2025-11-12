import { useState } from "react";
import styles from "@/Styles/ToggleSwitch.module.css"; 

const ToggleSwitch = () => {
  const [checked, setChecked] = useState(true);

  return (
    <div className={styles["checkbox-wrapper-5"]}>
      <div className={styles.check}>
        <input
          id="check-5"
          type="checkbox"
          checked={checked}
          onChange={() => setChecked(!checked)}
        />
        <label htmlFor="check-5"></label>
      </div>
    </div>
  );
};

export default ToggleSwitch;

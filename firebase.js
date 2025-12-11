import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD_Vt5U_OKXP1LOepSdsjpPUzs1FlKh3tE", 
  authDomain: "petalk-a70e1.firebaseapp.com", 
  projectId: "petalk-a70e1",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

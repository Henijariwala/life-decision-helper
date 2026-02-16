//firebase.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD4zyIOYaquJ_U9L5iWbPs-Dr-6S7Lfdxg",
  authDomain: "life-decision-helper.firebaseapp.com",
  projectId: "life-decision-helper",
  storageBucket: "life-decision-helper.firebasestorage.app",
  messagingSenderId: "596582127300",
  appId: "1:596582127300:web:434636b0a4d5af98f3db91",
  measurementId: "G-26XK9W7T51",
  type: "service_account",
  project_id: "life-decision-helper",
  private_key_id: "c1894c042dfd14e62807af875a89a07c943b605c",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7HHZtaopGoMNr\nrKe0v4CwWs2nv25UhDJ7bSZ7tFn9EPFH52HlLvThXG80Bw7avvT+B1EQBGhaLa9+\niKu0s9q3pba5flMW6RD3A8Hqc5an/ykv2OjOHIqVRCB4HYBzowB4D+8zA8FnfmFd\nWj+9wV/PFLHkY6NC/Lz8gGR2X6LUjvA19qFo17Uam5evd6ItEpzSSnrv7tN+MjSG\nkoSwrj4393ULXh0GFXVKQVyNHSzOkMefx7XOdna+O6vXy/qY4QPwDt6nb/jou2pI\nIqQV2LPlq0nrYffc8GfgEmFlH9XwDm2cYW6NLCU4KJ/XqyKKm8Sc9luZvDbvkecE\n+2scgU73AgMBAAECggEAHk+DjcEDCmLzlUdAWaLmHWtwQjrcDBvoM59gawyxwTGT\n7IJ6lM5RBArdxs9X5C6n8FjOFGqqXuVktvo72oeCKFrTaWQh4KW7xlAZAzpbTvai\nPOqF+BGej4ScP+kDjHf81PY72QdENtg9vIoopjwjoZ+oG6faZDkeAkdoPtbKQWVp\nNJUyUIQiGkQO9cO3FrO0G9pZR2wU+V82s5RKLCSgZRxQvgjE1XqqG0vqEueDczcv\nxJpRZ17grJlyOY1W0xke3W4NNdSH/p/70DPC5slinsSJVosuCwsLmxRdBInOAa6X\n1SkBOmWEDKxU94cdiZulTf+b1i+zxb/SGeE1Z7POdQKBgQDtt08MEF4wb5IZ+2RG\ntTaaPKeEkSa/hkJgSwSrHNPi3ijgzDJKgllM9HtJXsoIXSWwyyJGvUS1vE/E/CGj\n1QZAQqIHw3ntH4+scS9exGS4BTVWHEURWinRzxxL+XGmjA+xpVv23OQfshqt5Xup\n5RPcZZ0ENIulehV99oxjmRiq5QKBgQDJgLsRyi7Gnud2KQJlpWP6ZYscbT2rZt20\nvtoQ+s9cNpJ63vuGvokbft/hIDp3PjK5d/baRVUzFq4juGj4b1afr9zUrMWR/Dgv\ngXp/C2WN5FCrpdF4uqshJj35t3kfWwKqFCd+hvHwIWhwePQKzf0f3dFn8SeyCY1X\ncuH4mfAIqwKBgQCmJOGFsAb02XYG3NKYLN2N7Wiz2fN4FzFbNfN8WPiq7tUpUO6x\nbutVQubMQAj60YefSkqZoH1ee9BRAFvOsvvce/XdcT1Ngyqavrz6Ak/W4iUGG1oW\np6rk7ll7rEtHuUrawZVGM9rpYEUPV34YH3jDKO4WW1di/7H3yRMUJZO9FQKBgFNy\n6YYbijWdd1P69dAsp3P6e5sBLqn+RtDkvSCNDjUtMIqML/SEkfl+GK9+Dlh1vMIM\niYGpdvhaazHF3EsOqPwm87hr+MJVhts9rwJQMPWLWVFMsaxi+h4XXVE+h33Rzg+r\nmxOORUHiRANYRBD5b9uznFaEi6DyzcMqg6TV849TAoGAYdrQkYcejsvq0v6MQp9K\nZ+hJ+DF27sQExzakuNiL7ruVsRg7AkQH7NNC8In3UFCzQ3Ehn+T1sAH5bZj3nDzZ\nGhuxdg6AkLabiM+H4GgueBKkzkWDlDandrGb4QGF6x/eUFvQ4bI8F+oWGZiGqOSw\nfDL5kg4EYEZsQUiz22uHPcA=\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@life-decision-helper.iam.gserviceaccount.com",
  client_id: "107878663055536809429",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40life-decision-helper.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

  


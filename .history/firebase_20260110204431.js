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
  project_id: "wpchat-708a7",
  private_key_id: "899faf6aaa77316abc51d3648478722b5061ef70",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDXR8Hx3LS0g5n8\nURXOfUyK5kpZwTWLjYDsOv+lovdpFaRxm3GWclF7+ItFSE/iEvsmKEtBCDONu898\nEU5OI8KUrm31sW4xej9S6B0ud/j3VnU4Aj6jOvKMlXJh8MKmNGgwGowOnHe03HEz\n4GdA78I2acOHeLlznOBfo/FKUJBLlu18qrhl5U3Gzw0VvuKYRSLnyoM4t/6sqpNd\nkYEeq/pAfmgLx2KGxoDvqU2j3ogXy2/1CZqW3Nq4QjqxkORtVqUlK1Fc6KT0mTR+\n+yUVJxcv9B+CwsprN4rp/b3os+1Mina2CG7niP9EU5wIU6SxZ2PQuqwUKkyH6wgm\n3jTTbHePAgMBAAECggEAA2guJb2S7zUSokocOLzbPGrW7A22jbirEidVirxbWFfl\n1tXEGe1BjzSIlmDwbAkAiC2PZ1ORu/aoGslhU7OVgunccUzMts69os/BP84ulqd7\nymugAdBPLLIOxzBavED3Ec/RvfIe+NyblAZt9o/0zbdQcgaTP2+mTg0s++VDgKwM\nM7ixv5p3E6cqcpNSuwp2B+kO0CKT+YmhtSlv9JyWwT1i2wsEAs0+nVLtgQTy7SyZ\nPY03MhE0vl/Mwoj1pJ0oSHj+N9eeBqPBiViNmL79Q6MBv1loi6Qy/DFGGuWXMfRm\nZZj7Ys8CeMv7cRyfc8hkwzyI/U+V09CXHGD918HYJQKBgQDwPaBnKrCeKaPgpgSv\nglzsuSydgL6rK9OHiCHWKux/BuiuiTMbAZnVg1acx5iz97BZC0Lw3sButVXEWujR\n3aV5MftYuPMETNWAI2reqy37bSkapdv/OQ8S1wrqK8CRkmc3cAwEPVq1/SxPNZu9\noXL8khJfWEHdm2+I/2edBQYFcwKBgQDlZvgu2VPddA2nLEblsq0+W+27TJcadTaB\n6KciMsKO+OGutVVy4h+w1h5n+juOvKDuepd1R/PoJS4/3y35FDRtKYtfkQkeRIMI\nn6pe27KYiqfK5O0SmUVmFRsmoSztrCskH4LRUFyez1SoP8Ir06TKZUtladxjD0Ob\n4DqEsrWedQKBgQDRY9VHtjSkVgTIy8qvsn8NsMQLL2iARr2ilmtvgJAKk1oArgKG\nGlobd9Lo6SrWSR9CLQeWa3/rvk9Xyii8qmQMgxzgkqr1Z4Z6neQK2cZFKzq1SDS8\ned4CfL29po68Eo+2CQngNB25G0Ygb8gjevF+5E3xHjqiTVTkYj/L4tIBswKBgAqw\np7QXMI9LTy+RIqSllOkpA4UM5qW2/JlFLDStxN9AvdOUY6z82Jk3ASe7Q3c9VwqF\n7/TpK3aP9P3I+q12wZKssu/7JD+i1bBbMGdHOaVeIL+Vt258cf110lQUgrF4qnH+\nfewfIJHN+5XzkqrULAO6gK7zJe//0Bi9dDymz0vZAoGAaNGJQxShyujjPxjd9P20\nLFRn1Ekz5S7Ok6aTSw/NCTU4Q9T6s2RvQ7rXYziYLg+dIFF/m/QKQZbSA2UDb48k\nvjgHHUZHwy+wIpTBs8BVtEjyRTM9kI7nzyTxf3Sa3nLJsfwBbrIjjDstGgLMyYCQ\nhG2wpGCVycYfoMEm6uupOoc=\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@wpchat-708a7.iam.gserviceaccount.com",
  client_id: "115485502447978426395",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40wpchat-708a7.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
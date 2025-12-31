import { lazy } from "react";
import type { FC, LazyExoticComponent } from "react";

const LazyLogin: LazyExoticComponent<FC> = lazy(() => import("../Pages/Login"));
const LazyRegister: LazyExoticComponent<FC> = lazy(() => import("../Pages/Register"));
const LazyResetPassword: LazyExoticComponent<FC> = lazy(() => import("../Pages/ResetPassword"));
const LazyForgotPassword: LazyExoticComponent<FC> = lazy(() => import("../Pages/ForgotPassword"));
const LazyUpload: LazyExoticComponent<FC> = lazy(() => import("../Pages/UploadFile"));
const LazyLanding: LazyExoticComponent<FC> = lazy(() => import("../Pages/Landing"));

const LazyFolder: LazyExoticComponent<FC> = lazy(() => import("../Comps/Folders"));
const LazyFile: LazyExoticComponent<FC> = lazy(() => import("../Comps/Files")); 


export {
  LazyLogin,
  LazyRegister,
  LazyResetPassword,
  LazyForgotPassword,
  LazyUpload,
  LazyLanding,
  LazyFolder,
  LazyFile,
};


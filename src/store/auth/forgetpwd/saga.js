import { takeEvery, fork, put, all, call } from "redux-saga/effects"

// Login Redux States
import { FORGET_PASSWORD } from "./actionTypes"
import { userForgetPasswordSuccess, userForgetPasswordError } from "./actions"

// API helper
import axiosApi from "../../../helpers/api_helper"

//If user is send successfully send mail link then dispatch redux action's are directly from here.
function* forgetUser({ payload: { user, history } }) {
  try {
    console.log("📧 [Password Reset] Requesting password reset for:", user.email);
    
    // Call the real backend API endpoint
    const response = yield call(axiosApi.post, "/auth/forgot-password", {
      email: user.email,
    })
    
    if (response.data) {
      console.log("✅ [Password Reset] Email sent successfully!", response.data);
      yield put(
        userForgetPasswordSuccess(
          response.data.msg || "If an account with that email exists, a password reset link has been sent."
        )
      )
    }
  } catch (error) {
    // Extract descriptive error message
    let errorMessage = "Failed to send reset link. Please try again.";
    
    console.error("❌ [Password Reset] Failed to send email:", {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message
    });
    
    if (error?.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      // Use backend error message if available
      if (data?.msg) {
        errorMessage = data.msg;
      } else if (data?.message) {
        errorMessage = data.message;
      } else {
        // Provide descriptive messages based on status code
        switch (status) {
          case 400:
            errorMessage = "Invalid email address. Please check and try again.";
            break;
          case 404:
            errorMessage = "Service not available. Please contact support.";
            break;
          case 429:
            errorMessage = "Too many requests. Please wait a few minutes before trying again.";
            break;
          case 500:
            errorMessage = "Server error. Please try again later.";
            break;
          default:
            errorMessage = `Request failed (Error ${status}). Please try again.`;
        }
      }
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    console.error("❌ [Password Reset] Error message shown to user:", errorMessage);
    yield put(userForgetPasswordError(errorMessage))
  }
}

export function* watchUserPasswordForget() {
  yield takeEvery(FORGET_PASSWORD, forgetUser)
}

function* forgetPasswordSaga() {
  yield all([fork(watchUserPasswordForget)])
}

export default forgetPasswordSaga

import axiosClient from './axiosClient.js'

export const requestPasswordReset = (email) =>
    axiosClient.post('/auth/password-reset/request/', { email })

export const verifyPasswordResetOtp = (email, otp) =>
    axiosClient.post('/auth/password-reset/verify/', { email, otp })

export const confirmPasswordReset = (email, otp, newPassword, confirmPassword) =>
    axiosClient.post('/auth/password-reset/confirm/', {
        email,
        otp,
        new_password: newPassword,
        confirm_password: confirmPassword,
    })

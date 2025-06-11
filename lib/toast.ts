// Simple toast utility that won't cause build issues
export const showSuccessToast = (message: string) => {
  console.log("Success:", message)
}

export const showErrorToast = (message: string) => {
  console.error("Error:", message)
}

export const showInfoToast = (message: string) => {
  console.log("Info:", message)
}

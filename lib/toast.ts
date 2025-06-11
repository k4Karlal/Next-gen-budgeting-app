import { toast } from "@/components/ui/use-toast"

export const showSuccessToast = (message: string) => {
  toast({
    title: "Success",
    description: message,
    variant: "default",
  })
}

export const showErrorToast = (message: string) => {
  toast({
    title: "Error",
    description: message,
    variant: "destructive",
  })
}

export const showInfoToast = (message: string) => {
  toast({
    title: "Info",
    description: message,
    variant: "default",
  })
}

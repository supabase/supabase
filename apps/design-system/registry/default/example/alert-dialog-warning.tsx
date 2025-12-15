import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from 'ui'

export default function AlertDialogWarning() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="outline">Show Alert Dialog</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Update branch with modified functions</AlertDialogTitle>
          <AlertDialogDescription>
            This branch has 3 modified edge functions that will be overwritten when updating with
            the latest functions from the production branch. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {/* [Danny] Add type="warning" to this AlertDialogAction once supported with #41336  */}
          <AlertDialogAction>Update branch</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

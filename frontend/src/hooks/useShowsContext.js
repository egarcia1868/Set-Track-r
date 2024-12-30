import { ShowsContext } from "../context/ShowsContext"
import { useContext } from "react"

export const useShowsContext = () => {
  const context = useContext(ShowsContext)

  if(!context) {
    throw Error('useShowsContext must be used inside a ShowsContextProvider')
  }

  return context
}
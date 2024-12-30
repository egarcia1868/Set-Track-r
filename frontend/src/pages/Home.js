import { useEffect } from "react"
import { useShowsContext } from "../hooks/useShowsContext"

// components
import ShowDetails from "../components/ShowDetails"
import ShowForm from "../components/ShowForm"

const Home = () => {
  const { shows, dispatch } = useShowsContext()

  useEffect(() => {
    const fetchShows = async () => {
      const response = await fetch('/api/shows')
      const json = await response.json()

      if (response.ok) {
        dispatch({type: 'SET_SHOWS', payload: json})
      }
    }

    fetchShows()
  }, [dispatch])

  return (
    <div className="home">
      <div className="shows">
        {shows && shows.map(show => (
          <ShowDetails show={show} key={show._id} />
        ))}
      </div>
      <ShowForm />
    </div>
  )
}

export default Home
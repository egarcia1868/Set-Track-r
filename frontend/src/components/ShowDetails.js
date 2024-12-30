import { useShowsContext } from '../hooks/useShowsContext'

const ShowDetails = ({ show }) => {
  const { dispatch } = useShowsContext()

  const handleClick = async () => {
    const response = await fetch('/api/shows/' + show._id, {
      method: 'DELETE'
    })
    const json = await response.json()

    if (response.ok) {
      dispatch({type: 'DELETE_SHOW', payload: json})
    }
  }

  return (
    <div className="show-details">
      <h4>{show.location} - {show.date}</h4>
      <p><strong>Load (kg): </strong>{show.load}</p>
      {/* I NEED TO RETRIEVE LIST OF SONGS AND DISPLAY THEM HERE */}
      {/* <p><strong>Number of reps: </strong>{show.reps}</p> */}
      <span className="material-symbols-outlined" onClick={handleClick}>delete</span>
    </div>
  )
}

export default ShowDetails
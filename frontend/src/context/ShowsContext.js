import { createContext, useReducer } from 'react'

export const ShowsContext = createContext()

export const showsReducer = (state, action) => {
  switch (action.type) {
    case 'SET_SHOWS':
      return { 
        shows: action.payload 
      }
    case 'CREATE_SHOW':
      return { 
        shows: [action.payload, ...state.shows] 
      }
    case 'DELETE_SHOW':
      return { 
        shows: state.shows.filter(w => w._id !== action.payload._id) 
      }
    default:
      return state
  }
}

export const ShowsContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(showsReducer, { 
    shows: null
  })
  
  return (
    <ShowsContext.Provider value={{ ...state, dispatch }}>
      { children }
    </ShowsContext.Provider>
  )
}
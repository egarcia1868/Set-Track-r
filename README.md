# MERN

### Fixes needed
Need to set up useContext to share state (concert info / form entry to remove error on change) throughout app
"Concert not found from API" error message not going away after change

### Things to save from set
Band Name
data.setlist[0].artist.name

Location
data.setlist[0].venue.city.name -- city.state -- city.country.name

Date
data.setlist[0].eventDate

Sets
data.setlist[0].sets.set.map((set) => {
  // psuedo code below
   "set": [
                    {
                        "name": "Set 1:",
                        "song": [
                            {
                                "name": "The Fire on My Tongue",
                                "info": ">"
                            },
                            {
                                "name": "Know It All"
                            },
                            {
                                "name": "Be Your Man"
                            },
                            {
                                "name": "Seven Weeks in County"
                            },
                            {
                                "name": "Happy Hollow"
                            },
                            {
                                "name": "Seney Stretch"
                            },
                            {
                                "name": "My Alice"
                            },
                            {
                                "name": "Bronzeback",
                                "info": ">"
                            },
                            {
                                "name": "Must Be Seven",
                                "info": ">"
                            },
                            {
                                "name": "Hide and Seek"
                            },
                            {
                                "name": "Dust in a Baggie",
                                "cover": {
                                    "mbid": "de730b2d-0e69-4fbc-a71a-99dcd1f32a10",
                                    "name": "Billy Strings & Don Julin",
                                    "sortName": "Strings, Billy & Julin, Don",
                                    "disambiguation": "",
                                    "url": "https://www.setlist.fm/setlists/billy-strings-and-don-julin-63c5c28f.html"
                                }
                            }
                        ]
                    },
})
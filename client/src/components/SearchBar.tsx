import React,{useState} from 'react'
import { TextField } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const SearchBar:React.FC = ()=>{

  const [query,setQuery] = useState("")
  const navigate = useNavigate()

  const handleKey = (e:React.KeyboardEvent)=>{

    if(e.key==="Enter"){
      navigate(`/search?q=${encodeURIComponent(query)}`)
    }

  }

  return(
    <TextField
      size="small"
      placeholder="Search inventories..."
      value={query}
      onChange={(e)=>setQuery(e.target.value)}
      onKeyDown={handleKey}
    />
  )
}

export default SearchBar
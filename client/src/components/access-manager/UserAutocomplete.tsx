import React,{useState,useEffect} from 'react'
import { Autocomplete, TextField } from '@mui/material'
import api from '../../api/axios'

interface User{
  id:string
  userName:string
}

interface Props{
  onSelect:(userId:string)=>void
}

const UserAutocomplete:React.FC<Props> = ({onSelect})=>{

  const [users,setUsers] = useState<User[]>([])

  useEffect(()=>{

    api.get("/users/search")
      .then(res=>setUsers(res.data))
      .catch(()=>{})

  },[])

  return(
    <Autocomplete
      options={users}
      getOptionLabel={(u)=>u.userName}
      onChange={(_,v)=>v && onSelect(v.id)}
      renderInput={(params)=>
        <TextField {...params} label="Add user"/>
      }
    />
  )
}

export default UserAutocomplete
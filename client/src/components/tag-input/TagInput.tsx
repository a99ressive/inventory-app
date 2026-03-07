import React from 'react'
import { Autocomplete, TextField } from '@mui/material'

interface Props{
  value:string[]
  onChange:(v:string[])=>void
  options:string[]
}

const TagInput:React.FC<Props> = ({value,onChange,options})=>{

  return(
    <Autocomplete
      multiple
      freeSolo
      options={options}
      value={value}
      onChange={(_,newValue)=>onChange(newValue)}
      renderInput={(params)=>(
        <TextField {...params} label="Tags"/>
      )}
    />
  )
}

export default TagInput
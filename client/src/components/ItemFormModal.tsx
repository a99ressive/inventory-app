import React, { useEffect, useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  CircularProgress
} from '@mui/material';
import api from '../api/axios';
import DynamicItemForm from './forms/DynamicItemForm'
import type { CustomField } from '../types';
import type { Item } from '../types';

interface Props {
  open: boolean
  onClose: () => void
  inventoryId: string
  item?: Item
  fields: CustomField[]
  onSuccess: () => void
}

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%,-50%)',
  width: 500,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4
}

type ItemValues = Record<string, unknown>

const ItemFormModal: React.FC<Props> = ({
  open,
  onClose,
  inventoryId,
  item,
  fields,
  onSuccess
}) => {

  const [values, setValues] = useState<ItemValues>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (item) {
      setValues(item.Data as ItemValues)
    } else {
      setValues({})
    }
  }, [item])

  const handleChange = (field: string, value: unknown) => {
    setValues(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async () => {

    try {
      setLoading(true)

      if (item) {
        await api.put(`/inventory/${inventoryId}/items/${item.Id}`, {
          customId: item.CustomId,
          data: values,
          rowVersion: item.RowVersion
        })
      } else {
        await api.post(`/inventory/${inventoryId}/items`, {
          data: values
        })
      }

      onSuccess()
      onClose()

    } catch {
      alert("Failed to save item")
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose}>

      <Box sx={style}>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {item ? "Edit Item" : "Create Item"}
        </Typography>

        <DynamicItemForm
          fields={fields}
          values={values}
          onChange={handleChange}
        />

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={onClose}>Cancel</Button>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <CircularProgress size={22} /> : "Save"}
          </Button>
        </Box>

      </Box>

    </Modal>
  )
}

export default ItemFormModal
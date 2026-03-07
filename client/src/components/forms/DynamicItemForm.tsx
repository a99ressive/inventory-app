import React from 'react';
import { TextField, Checkbox, FormControlLabel, Stack } from '@mui/material';
import type { CustomField } from '../../types'

interface Props {
  fields: CustomField[];
  values: Record<string, unknown>;
  onChange: (field: string, value: unknown) => void;
}

const DynamicItemForm: React.FC<Props> = ({ fields, values, onChange }) => {

  return (
    <Stack spacing={2}>
      {fields.map(field => {

        const rawValue = values[field.Title]

        switch (field.Type) {

          case "SingleLineText":
          case "MultiLineText": {

            const value = typeof rawValue === "string" ? rawValue : ""

            return (
              <TextField
                key={field.Title}
                label={field.Title}
                multiline={field.Type === "MultiLineText"}
                rows={field.Type === "MultiLineText" ? 4 : undefined}
                helperText={field.Description}
                value={value}
                onChange={(e) => onChange(field.Title, e.target.value)}
              />
            )
          }

          case "Number": {

            const value = typeof rawValue === "number" ? rawValue : 0

            return (
              <TextField
                key={field.Title}
                label={field.Title}
                type="number"
                value={value}
                onChange={(e) => onChange(field.Title, Number(e.target.value))}
              />
            )
          }

          case "Boolean": {

            const value = typeof rawValue === "boolean" ? rawValue : false

            return (
              <FormControlLabel
                key={field.Title}
                control={
                  <Checkbox
                    checked={value}
                    onChange={(e) => onChange(field.Title, e.target.checked)}
                  />
                }
                label={field.Title}
              />
            )
          }

          default:
            return null
        }
      })}
    </Stack>
  )
}

export default DynamicItemForm
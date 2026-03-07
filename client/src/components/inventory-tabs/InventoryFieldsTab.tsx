import React from 'react';
import {
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { parseCustomFields } from '../../utils/inventoryData';

interface InventoryFieldsTabProps {
  customFields: unknown;
  canEdit: boolean;
}

const InventoryFieldsTab: React.FC<InventoryFieldsTabProps> = ({
  customFields,
  canEdit,
}) => {
  const fields = React.useMemo(() => parseCustomFields(customFields), [customFields]);

  return (
    <>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Fields
      </Typography>

      {!canEdit && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You have read-only access to field settings.
        </Alert>
      )}

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Show in table</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field) => (
              <TableRow key={`${field.Type}-${field.Title}`}>
                <TableCell>{field.Title}</TableCell>
                <TableCell>{field.Type}</TableCell>
                <TableCell>{field.Description || '-'}</TableCell>
                <TableCell>{field.ShowInTable ? 'Yes' : 'No'}</TableCell>
              </TableRow>
            ))}

            {fields.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No custom fields configured
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
};

export default InventoryFieldsTab;

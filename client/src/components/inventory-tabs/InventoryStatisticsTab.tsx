import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Box,
} from '@mui/material';
import type { Item } from '../../types';
import { parseCustomFields } from '../../utils/inventoryData';

interface InventoryStatisticsTabProps {
  items: Item[];
  customFields: unknown;
}

type NumericStatRow = {
  title: string;
  count: number;
  min: number;
  max: number;
  avg: number;
};

type StringStatRow = {
  title: string;
  topValues: string;
};

function safeNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

const InventoryStatisticsTab: React.FC<InventoryStatisticsTabProps> = ({
  items,
  customFields,
}) => {
  const fields = React.useMemo(() => parseCustomFields(customFields), [customFields]);

  const numericStats = React.useMemo<NumericStatRow[]>(() => {
    return fields
      .filter((field) => field.Type === 'number')
      .map((field) => {
        const values = items
          .map((item) => safeNumber(item.Data[field.Title]))
          .filter((value): value is number => value !== null);

        if (values.length === 0) {
          return {
            title: field.Title,
            count: 0,
            min: 0,
            max: 0,
            avg: 0,
          };
        }

        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((sum, value) => sum + value, 0) / values.length;

        return {
          title: field.Title,
          count: values.length,
          min,
          max,
          avg,
        };
      });
  }, [fields, items]);

  const stringStats = React.useMemo<StringStatRow[]>(() => {
    return fields
      .filter((field) => field.Type === 'string' || field.Type === 'text')
      .map((field) => {
        const frequency = new Map<string, number>();

        for (const item of items) {
          const raw = item.Data[field.Title];
          if (typeof raw !== 'string' || raw.trim().length === 0) continue;

          const key = raw.trim();
          frequency.set(key, (frequency.get(key) ?? 0) + 1);
        }

        const topValues = Array.from(frequency.entries())
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .slice(0, 3)
          .map(([value, count]) => `${value} (${count})`)
          .join(', ');

        return {
          title: field.Title,
          topValues: topValues || '-',
        };
      });
  }, [fields, items]);

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Statistics
      </Typography>

      <Typography variant="body1" sx={{ mb: 2 }}>
        Total items: {items.length}
      </Typography>

      <Paper sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Numeric field</TableCell>
              <TableCell>Count</TableCell>
              <TableCell>Min</TableCell>
              <TableCell>Max</TableCell>
              <TableCell>Average</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {numericStats.map((row) => (
              <TableRow key={row.title}>
                <TableCell>{row.title}</TableCell>
                <TableCell>{row.count}</TableCell>
                <TableCell>{row.count > 0 ? row.min : '-'}</TableCell>
                <TableCell>{row.count > 0 ? row.max : '-'}</TableCell>
                <TableCell>{row.count > 0 ? row.avg.toFixed(2) : '-'}</TableCell>
              </TableRow>
            ))}

            {numericStats.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No numeric fields configured
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Text field</TableCell>
              <TableCell>Most frequent values</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stringStats.map((row) => (
              <TableRow key={row.title}>
                <TableCell>{row.title}</TableCell>
                <TableCell>{row.topValues}</TableCell>
              </TableRow>
            ))}

            {stringStats.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} align="center">
                  No string/text fields configured
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default InventoryStatisticsTab;

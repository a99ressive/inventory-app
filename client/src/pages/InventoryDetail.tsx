import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Tabs,
  Tab,
  Paper,
  Box,
  Chip,
} from '@mui/material';
import api from '../api/axios';
import type { Inventory, Item, CustomField } from '../types';
import AccessSettingsTab from '../components/AccessSettingsTab';
import InventoryItemsTab from '../components/inventory-tabs/InventoryItemsTab';
import InventoryDiscussionTab from '../components/inventory-tabs/InventoryDiscussionTab';
import InventoryGeneralTab from '../components/inventory-tabs/InventoryGeneralTab';
import InventoryCustomIdTab from '../components/inventory-tabs/InventoryCustomIdTab';
import InventoryFieldsTab from '../components/inventory-tabs/InventoryFieldsTab';
import InventoryStatisticsTab from '../components/inventory-tabs/InventoryStatisticsTab';
import { parseCustomFields } from '../utils/inventoryData';
import { resolveInventoryPermissions } from '../utils/inventoryPermissions';

const InventoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);

  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);

      const [inventoryRes, itemsRes] = await Promise.all([
        api.get(`/Inventory/${id}`),
        api.get(`/inventory/${id}/items`),
      ]);

      setInventory(inventoryRes.data);
      setItems(itemsRes.data ?? []);
      setError('');
    } catch {
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const token = localStorage.getItem('token');
  const permissions = useMemo(
    () => (inventory ? resolveInventoryPermissions(inventory, token) : null),
    [inventory, token]
  );

  const customFields = useMemo(
    () => parseCustomFields(inventory?.CustomFields),
    [inventory?.CustomFields]
  );
  const tableFields = useMemo(
    () => customFields.filter((field) => field.ShowInTable),
    [customFields]
  );

  useEffect(() => {
    if (tab === 4 && !permissions?.canManageAccess) {
      setTab(0);
    }
  }, [permissions?.canManageAccess, tab]);

  const onInventoryUpdated = (patch: Partial<Inventory>) => {
    setInventory((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const onFieldsUpdated = (newFields: CustomField[]) => {
    setInventory((prev) =>
      prev
        ? { ...prev, CustomFields: newFields as unknown as typeof prev.CustomFields }
        : prev
    );
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!inventory || !id) return <Alert severity="error">Inventory not found</Alert>;
  if (!permissions) return <Alert severity="error">Unable to resolve permissions</Alert>;

  return (
    <div>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            {inventory.Title}
          </Typography>
          {inventory.Description && (
            <Typography variant="body1" color="text.secondary" paragraph>
              {inventory.Description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={`Role: ${permissions.role}`} size="small" />
            <Chip label={`Public: ${inventory.IsPublic ? 'Yes' : 'No'}`} size="small" />
            <Chip label={`Type ID: ${inventory.InventoryTypeId}`} size="small" />
          </Box>
        </CardContent>
      </Card>

      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, next) => setTab(next)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Items" />
          <Tab label="Discussion" />
          <Tab label="General settings" />
          <Tab label="Custom ID" />
          <Tab label="Access settings" disabled={!permissions.canManageAccess} />
          <Tab label="Fields" />
          <Tab label="Statistics" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <InventoryItemsTab
          inventoryId={id}
          items={items}
          canWrite={permissions.canWriteItems}
          tableFields={tableFields}
          allFields={customFields} 
          onRefresh={loadData}
        />
      )}

      {tab === 1 && (
        <InventoryDiscussionTab
          inventoryId={id}
          isAuthenticated={permissions.isAuthenticated}
          canPost={permissions.canPostDiscussion}
        />
      )}

      {tab === 2 && (
        <InventoryGeneralTab
          inventory={inventory}
          canEdit={permissions.canEditGeneral}
          onInventoryUpdated={onInventoryUpdated}
        />
      )}

      {tab === 3 && (
        <InventoryCustomIdTab
          inventoryId={id}
          customIdConfig={inventory.CustomIdConfig}
          canEdit={permissions.canEditCustomId}
        />
      )}

      {tab === 4 &&
        (permissions.canManageAccess ? (
          <AccessSettingsTab inventoryId={id} ownerId={inventory.OwnerId} />
        ) : (
          <Alert severity="info">You do not have permission to manage access settings.</Alert>
        ))}

      {tab === 5 && (
        <InventoryFieldsTab
          inventoryId={id} 
          customFields={inventory.CustomFields}
          canEdit={permissions.canEditFields}
          onFieldsUpdated={onFieldsUpdated}
        />
      )}

      {tab === 6 && (
        <InventoryStatisticsTab
          items={items}
          customFields={inventory.CustomFields}
        />
      )}
    </div>
  );
};

export default InventoryDetail;

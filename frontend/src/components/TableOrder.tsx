import { useState } from 'react';
import {
  IndexTable,
  LegacyCard,
  Text,
  Badge,
  Popover,
  Button,
  ActionList,
  Icon,
  Pagination,
  useIndexResourceState,
} from '@shopify/polaris';
import { PrintIcon } from '@shopify/polaris-icons';

// Update the interface to include an index signature
interface OrderItem {
  id: string;
  orderNumber: string;
  customer: string;
  total: string;
  paymentStatus: 'Paid' | 'Pending' | 'Refunded';
  fulfillmentStatus: 'Fulfilled' | 'Unfulfilled' | 'Partial';
  [key: string]: unknown; // This adds the index signature
}

export function TableOrder() {
  const [popoverActive, setPopoverActive] = useState<{[key: string]: boolean}>({});
  const [currentPage, setCurrentPage] = useState(1);
  
  const orders: OrderItem[] = [
    {
      id: '1',
      orderNumber: '#1001',
      customer: 'John Doe',
      total: '$120.00',
      paymentStatus: 'Paid',
      fulfillmentStatus: 'Fulfilled',
    },
    {
      id: '2',
      orderNumber: '#1002',
      customer: 'Jane Smith',
      total: '$85.50',
      paymentStatus: 'Pending',
      fulfillmentStatus: 'Unfulfilled',
    },
    {
      id: '3',
      orderNumber: '#1003',
      customer: 'Robert Johnson',
      total: '$250.00',
      paymentStatus: 'Paid',
      fulfillmentStatus: 'Partial',
    },
    {
      id: '4',
      orderNumber: '#1004',
      customer: 'Emily Davis',
      total: '$75.25',
      paymentStatus: 'Refunded',
      fulfillmentStatus: 'Fulfilled',
    },
    {
      id: '5',
      orderNumber: '#1005',
      customer: 'Michael Wilson',
      total: '$180.00',
      paymentStatus: 'Paid',
      fulfillmentStatus: 'Unfulfilled',
    },
  ];

  const resourceName = {
    singular: 'order',
    plural: 'orders',
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } = 
    useIndexResourceState(orders, {
      resourceIDResolver: (item: OrderItem) => item.id
    });
  const togglePopoverActive = (id: string) => {
    setPopoverActive(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handlePrintAction = (orderId: string, type: 'invoice' | 'picking' | 'refund') => {
    // Handle print action based on type
    console.log(`Printing ${type} for order ${orderId}`);
    togglePopoverActive(orderId);
  };

  const renderPaymentStatusBadge = (status: string) => {
    let tone: "success" | "info" | "warning" | "critical" | "attention" | "new" | undefined = "success";
    
    if (status === "Pending") {
      tone = "warning";
    } else if (status === "Refunded") {
      tone = "critical";
    }
    
    return <Badge tone={tone}>{status}</Badge>;
  };

  const renderFulfillmentStatusBadge = (status: string) => {
    let tone: "success" | "info" | "warning" | "critical" | "attention" | "new" | undefined = "success";
    
    if (status === "Unfulfilled") {
      tone = "critical";
    } else if (status === "Partial") {
      tone = "warning";
    }
    
    return <Badge tone={tone}>{status}</Badge>;
  };

  const rowMarkup = orders.map(
    ({ id, orderNumber, customer, total, paymentStatus, fulfillmentStatus }, index) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {orderNumber}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{customer}</IndexTable.Cell>
        <IndexTable.Cell>{total}</IndexTable.Cell>
        <IndexTable.Cell>
          {renderPaymentStatusBadge(paymentStatus)}
        </IndexTable.Cell>
        <IndexTable.Cell>
          {renderFulfillmentStatusBadge(fulfillmentStatus)}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Popover
            active={popoverActive[id] || false}
            activator={
              <Button 
                onClick={() => togglePopoverActive(id)} 
                icon={<Icon source={PrintIcon} />}
                variant="tertiary"
              />
            }
            onClose={() => togglePopoverActive(id)}
          >
            <ActionList
              actionRole="menuitem"
              items={[
                {
                  content: 'Invoice',
                  onAction: () => handlePrintAction(id, 'invoice'),
                },
                {
                  content: 'Picking slip',
                  onAction: () => handlePrintAction(id, 'picking'),
                },
                {
                  content: 'Refund',
                  onAction: () => handlePrintAction(id, 'refund'),
                },
              ]}
            />
          </Popover>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <LegacyCard>
      <IndexTable
        resourceName={resourceName}
        itemCount={orders.length}
        selectedItemsCount={
          allResourcesSelected ? 'All' : selectedResources.length
        }
        onSelectionChange={handleSelectionChange}
        headings={[
          { title: 'Order' },
          { title: 'Customer' },
          { title: 'Total' },
          { title: 'Payment status' },
          { title: 'Fulfillment status' },
          { title: 'Actions' },
        ]}
      >
        {rowMarkup}
      </IndexTable>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
        <Pagination
          hasPrevious={currentPage > 1}
          onPrevious={() => setCurrentPage(currentPage - 1)}
          hasNext
          onNext={() => setCurrentPage(currentPage + 1)}
        />
      </div>
    </LegacyCard>
  );
}

export default TableOrder;
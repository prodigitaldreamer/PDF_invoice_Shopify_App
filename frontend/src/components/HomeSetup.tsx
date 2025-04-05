import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Page,
  Card,
  Text,
  ProgressBar,
  InlineStack,
  BlockStack,
  Box,
  Layout,
  Checkbox,
} from '@shopify/polaris';
import { ConfigData, Task } from '../types';

export const HomeSetup: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: "Fill in your store information",
      description: "This information will be auto-filled on invoices",
      completed: false,
      hasSettings: true,
      expanded: false,
      statusKey: "is_open_setup_info"
    },
    {
      id: 2,
      title: "Add a Print Invoice Button to Shopify",
      description: "This allows you to preview and print invoices on the Shopify admin order page, and your customers can do the same on their order status page",
      completed: false,
      hasSettings: true,
      expanded: false,
      statusKey: "is_allow_frontend"
    },
    {
      id: 3,
      title: "Insert a download link into the notification email",
      description: "This feature enables your customers to access and download their invoices from the Shopify order email",
      completed: false,
      isActive: true,
      hasSettings: true,
      expanded: false
    },
    {
      id: 4,
      title: "Customize invoice number",
      description: "Customize how invoice numbers are generated and displayed",
      completed: false,
      hasSettings: false,
      expanded: false
    },
    {
      id: 5,
      title: "Customize Your Invoice Templates",
      description: "Personalize the look and feel of your invoice templates",
      completed: false,
      hasSettings: false,
      expanded: false,
      statusKey: "is_open_template_setting"
    }
  ]);

  // Add state to store config data
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [configLoaded, setConfigLoaded] = useState<boolean>(false);
  
  // Use effect to safely access window.config after component mounts
  useEffect(() => {
    // Function to check if config is available
    const checkForConfig = () => {
      if (window.config) {
        console.log("window.config loaded", window.config );
        setConfig(window.config);
        setConfigLoaded(true);
        return true;
      }
      return false;
    };
    
    // Try to get config immediately
    if (!checkForConfig()) {
      // If not available, set up a listener for when the script might load
      const configCheckInterval = setInterval(() => {
        if (checkForConfig()) {
          clearInterval(configCheckInterval);
        }
      }, 100);
      
      // Clean up interval after 5 seconds if config never loads
      setTimeout(() => {
        clearInterval(configCheckInterval);
        if (!configLoaded) {
          console.error("Failed to load window.config");
          setConfigLoaded(true); // Mark as loaded anyway to prevent waiting indefinitely
        }
      }, 5000);
      
      return () => {
        clearInterval(configCheckInterval);
      };
    }
  }, []);
  
  // Update task completion status based on config data
  useEffect(() => {
    if (config) {
      const setupTasks = config.setup_tasks;
      
      // Create a local copy of tasks to update
      let updatedTasks = [...tasks];
      
      // Update based on both info and setupTasks
      if (setupTasks) {
        // Update task status directly from setupTasks
        updatedTasks = updatedTasks.map(task => {
          if (task.id === 1) {
            return { ...task, completed: setupTasks.check_infor };
          } else if (task.id === 2) {
            return { ...task, completed: setupTasks.check_print_button };
          } else if (task.id === 3) {
            return { ...task, completed: setupTasks.check_insert_button };
          } else if (task.id === 4) {
            return { ...task, completed: setupTasks.check_custom_invoice_number };
          } else if (task.id === 5) {
            return { ...task, completed: setupTasks.check_custom_invoice_template };
          }
          return task;
        });
      }
      
      // Update state with all changes
      setTasks(updatedTasks);
    }
  }, [config]);

  const completedTasks = tasks.filter(task => task.completed).length;
  const progressPercentage = (completedTasks / tasks.length) * 100;

  // Get shop name from config, default to "Store" if not available
  const shopName = config?.info?.shop_name || "Store";

  // Add navigate function from React Router

  
  // Replace navigate with direct location change
  const handleTaskClick = (taskId: number) => {
    // Check which task was clicked and navigate to appropriate section
    if (taskId === 1) {
      window.location.href = '/order-printer/settings?section=store-info';
    } else if (taskId === 2) {
      window.location.href = '/order-printer/settings?section=print-button';
    } else if (taskId === 3) {
      window.location.href = '/order-printer/settings?section=email-notification';
    } else if (taskId === 4) {
      window.location.href = '/order-printer/settings?section=invoice-number';
    }
  };

  // Add a function to handle checkbox changes
  const handleCheckboxChange = (taskId: number, checked: boolean, e?: React.MouseEvent | React.ChangeEvent) => {
    // Stop any event propagation first
    if (e) {
      e.stopPropagation();
    }
    
    // Store original tasks state for potential rollback
    const originalTasks = [...tasks];
    
    // Optimistic UI update - immediately show the change
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed: checked } : task
    );
    
    setTasks(updatedTasks);
    
    // Get shop from config
    const shop = config?.info?.shop || '';
    
    // Create data object properly
    const requestData = {
      taskId: taskId,
      checked: checked,
      shop: shop
    };
    
    // Save the task status to the backend using axios
    axios.post('/order-printer/save/task', {
      data: requestData  // Wrap in 'data' property as requested
    })
    .then(response => {
      const data = response.data;
      if (data.result.status) {
        shopify.toast.show('Task status updated successfully', {
          duration: 5000,
        });
        // Ensure UI is updated with the confirmed state from server
        const confirmedTasks = tasks.map(task => 
          task.id === taskId ? { ...task, completed: checked } : task
        );
        setTasks(confirmedTasks);
      } else {
        shopify.toast.show('Failed to update task status', {
          duration: 5000,
        });
        // Revert the optimistic UI update if the API call fails
        setTasks(originalTasks);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      // Revert the optimistic UI update if the API call fails
      setTasks(originalTasks);
    });
  };

  return (
    <Page title={`Welcome ${shopName}`}>
      <Layout>
        <Layout.Section>
      <Card>
        <BlockStack gap="400">
          <BlockStack gap="100">
            <Text as="h2" variant="headingMd">Setup guide</Text>
            <Text as="p" variant="bodyMd" tone="subdued">
              Use this personalized guide to setup your invoices
            </Text>
          </BlockStack>

          <Box>
            <div style={{ width: '50%' }}>
              <InlineStack wrap={false} blockAlign='center' gap="400">
                <Text as="p" variant="bodyMd">{`Step ${completedTasks}  of ${tasks.length}  tasks complete`}</Text>
                <div style={{ flex: 1 }}>
                  <ProgressBar size='small' progress={progressPercentage} />
                </div>
              </InlineStack>
            </div>
          </Box>
          <BlockStack gap="400">
            {tasks.map((task) => (
              <Card
                key={task.id}
                padding="400"
              >
                <InlineStack gap="400" blockAlign="start" wrap={false}>
                  <div 
                    style={{ display: 'flex', alignItems: 'center' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={task.completed}
                      onChange={(checked) => {
                        // Pass the synthetic event to stop propagation
                        handleCheckboxChange(task.id, checked);
                      }}
                      label=""
                    />
                  </div>
                  <BlockStack gap="100">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTaskClick(task.id);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <Text
                        as="h3"
                        variant="bodyMd"
                        fontWeight='bold'
                      >
                        {task.title}
                      </Text>
                    </div>
                    {task.description && (
                      <Text as="p" variant="bodyMd" tone="subdued">
                        {task.description}
                      </Text>
                    )}
                  </BlockStack>
                </InlineStack>
              </Card>
            ))}
          </BlockStack>
        </BlockStack>
      </Card>
      </Layout.Section>
      </Layout>
    </Page>
  );
};

export default HomeSetup;
import React, { useState, useEffect } from 'react';
import {
  Page,
  Card,
  Text,
  ProgressBar,
  Button,
  InlineStack,
  BlockStack,
  Box,
  Layout,
  Icon,
} from '@shopify/polaris';
import { SkeletonIcon, CheckIcon } from '@shopify/polaris-icons';
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
        console.log("window.config loaded", );
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
    if (config?.info) {
      const info = config.info;
      
      // Create a local copy of tasks to update
      let updatedTasks = [...tasks];
      
      // Task 1: Check if store information is filled
      if (info.name !== '' || info.phone !== '') {
        updatedTasks = updatedTasks.map(task => 
          task.id === 1 ? { ...task, completed: true } : task
        );
      }
      
      // Task 2: Check if print invoice button is enabled
      if (info.allow_frontend || info.allow_backend) {
        updatedTasks = updatedTasks.map(task => 
          task.id === 2 ? { ...task, completed: true } : task
        );
      }
      
      // Task 3: Check email notification template (assuming this is the right field)
      if (info.email_notify_template && info.email_notify_template !== '') {
        updatedTasks = updatedTasks.map(task => 
          task.id === 3 ? { ...task, completed: true } : task
        );
      }
      
      // Task 4: Check invoice numbering
      if (info.invoice_start_number && info.invoice_start_number !== '') {
        updatedTasks = updatedTasks.map(task => 
          task.id === 4 ? { ...task, completed: true } : task
        );
      }
      
      // Task 5: Check if templates exist
      if (config.templates && config.templates.length > 0) {
        updatedTasks = updatedTasks.map(task => 
          task.id === 5 ? { ...task, completed: true } : task
        );
      }
      
      // Update state with all changes
      setTasks(updatedTasks);
    }
  }, [config]);

  const completedTasks = tasks.filter(task => task.completed).length;
  const progressPercentage = (completedTasks / tasks.length) * 100;
  
  const handleSettings = (taskId: number) => {
    console.log(`Opening settings for task ${taskId}`);
    // Implementation for opening settings
  };

  // Handler to toggle expanded state
  const toggleExpand = (taskId: number) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, expanded: !task.expanded } : task
      )
    );
  };

  // Get shop name from config, default to "Store" if not available
  const shopName = config?.info?.shop_name || "Store";
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
                <Text as="p" variant="bodyMd">{`Step ${completedTasks} of ${tasks.length} tasks complete`}</Text>
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
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Icon
                      source={task.completed ? CheckIcon : SkeletonIcon}
                    />
                  </div>
                  <BlockStack gap="100">
                    <div
                      onClick={() => toggleExpand(task.id)}
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
                    {task.expanded && (
                      <>
                        {task.description && (
                          <Text as="p" variant="bodyMd" tone="subdued">
                            {task.description}
                          </Text>
                        )}
                        {task.hasSettings && (
                          <Box paddingBlockStart="200">
                            <InlineStack gap="200">
                              <Button
                                onClick={() => handleSettings(task.id)}
                                variant="secondary"
                                size="slim"
                              >
                                Setting
                              </Button>
                            </InlineStack>
                          </Box>
                        )}
                      </>
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
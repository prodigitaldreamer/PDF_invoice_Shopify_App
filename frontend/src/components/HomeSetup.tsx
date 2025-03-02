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

import {SkeletonIcon, CheckIcon} from '@shopify/polaris-icons';

// Define TypeScript interface for your config object
interface ConfigData {
  // Add properties that you expect in your config object
  // For example:
  storeName?: string;
  apiEndpoint?: string;
  shopifyData?: any;
  // Add other properties as needed
}

// Declare the global window property
declare global {
  interface Window {
    config?: ConfigData;
  }
}

interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  isActive?: boolean;
  hasSettings?: boolean;
  expanded?: boolean;
}

interface HomeSetupProps {
  storeName?: string;
}
export const HomeSetup: React.FC<HomeSetupProps> = ({ storeName = "Store" }) => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: "Fill in your store information",
      description: "This information will be auto-filled on invoices",
      completed: true,
      hasSettings: true,
      expanded: false
    },
    {
      id: 2,
      title: "Add a Print Invoice Button to Shopify",
      description: "This allows you to preview and print invoices on the Shopify admin order page, and your customers can do the same on their order status page",
      completed: true,
      hasSettings: true,
      expanded: false
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
      expanded: false  // Explicitly set expanded property
    },
    {
      id: 5,
      title: "Customize Your Invoice Templates",
      description: "Personalize the look and feel of your invoice templates",
      completed: false,
      hasSettings: false,
      expanded: false  // Explicitly set expanded property
    }
  ]);

  const completedTasks = tasks.filter(task => task.completed).length;
  const progressPercentage = (completedTasks / tasks.length) * 100;

  // Add state to store config data
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [configLoaded, setConfigLoaded] = useState<boolean>(false);
  console.log("Config loaded:", config);
  
  // Use effect to safely access window.config after component mounts
  useEffect(() => {
    // Function to check if config is available
    const checkForConfig = () => {
      if (window.config) {
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
  
  // Use config data after it's loaded
  useEffect(() => {
    if (config) {
      console.log("Config loaded:", config);
      // Initialize your component with the config data
      // For example:
      if (config.storeName) {
        // Use config.storeName for something
      }
    }
  }, [config]);

  
  const handleSettings = (taskId: number) => {
    console.log(`Opening settings for task ${taskId}`);
    // Implementation for opening settings
  };

  const handleSkipAll = () => {
    console.log('Skip all tasks');
    // Implementation for skipping all tasks
  };

  // New handler to toggle expanded state
  const toggleExpand = (taskId: number) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, expanded: !task.expanded } : task
      )
    );
  };

  return (
    <Page title={`Welcome ${config?.storeName || storeName}`}>
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
                <Button
                  onClick={handleSkipAll}
                >
                  Skip all
                </Button>
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
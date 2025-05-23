import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { pluginManager } from '@/plugins';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from '@/utils/toast';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import Config from '@/core/appConfig';

interface PluginItem {
  name: string;
  hash: string;
  enabled: boolean;
  version?: string;
  author?: string;
}

export default function PluginManagerScreen() {
  const [plugins, setPlugins] = useState<PluginItem[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [pluginUrl, setPluginUrl] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    // Set up navigation options
    navigation.setOptions({
      title: 'Plugin Manager',
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={{ marginRight: 15 }}
            onPress={handleAddPlugin}
          >
            <Text style={{ fontSize: 16, color: '#007AFF' }}>Add</Text>
          </TouchableOpacity>
        </View>
      ),
    });

    // Load plugins
    loadPlugins();
  }, [refreshKey]);

  const loadPlugins = () => {
    const allPlugins = pluginManager.getAllPlugins();
    setPlugins(allPlugins);
  };

  const handleAddPlugin = () => {
    Alert.alert(
      'Add Plugin',
      'Choose how to add a plugin',
      [
        {
          text: 'From URL',
          onPress: () => setModalVisible(true),
        },
        {
          text: 'From File',
          onPress: handleAddPluginFromFile,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleAddPluginFromUrl = async () => {
    if (!pluginUrl) {
      Toast.warn('Please enter a valid URL');
      return;
    }

    try {
      setModalVisible(false);
      const result = await pluginManager.installPluginFromUrl(
        pluginUrl,
        Config.getConfig('basic.notCheckPluginVersion')
      );

      if (result.success) {
        Toast.success(`Plugin "${result.pluginName}" installed successfully`);
        setRefreshKey(prev => prev + 1);
      } else {
        Toast.warn(`Failed to install plugin: ${result.message}`);
      }
    } catch (error) {
      Toast.warn(`Error installing plugin: ${error.message}`);
    } finally {
      setPluginUrl('');
    }
  };

  const handleAddPluginFromFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/javascript',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        const installResult = await pluginManager.installPluginFromLocalFile(
          result.uri,
          Config.getConfig('basic.notCheckPluginVersion')
        );

        if (installResult.success) {
          Toast.success(`Plugin "${installResult.pluginName}" installed successfully`);
          setRefreshKey(prev => prev + 1);
        } else {
          Toast.warn(`Failed to install plugin: ${installResult.message}`);
        }
      }
    } catch (error) {
      Toast.warn(`Error selecting plugin file: ${error.message}`);
    }
  };

  const togglePluginEnabled = (name: string, enabled: boolean) => {
    pluginManager.setPluginEnabled(name, enabled);
    setRefreshKey(prev => prev + 1);
  };

  const renderPluginItem = ({ item }: { item: PluginItem }) => (
    <View style={styles.pluginItem}>
      <View style={styles.pluginInfo}>
        <Text style={styles.pluginName}>{item.name}</Text>
        <Text style={styles.pluginVersion}>
          {item.version ? `v${item.version}` : 'No version'}
          {item.author ? ` • ${item.author}` : ''}
        </Text>
      </View>
      <Switch
        value={item.enabled}
        onValueChange={value => togglePluginEnabled(item.name, value)}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={plugins}
        renderItem={renderPluginItem}
        keyExtractor={item => item.hash}
        contentContainerStyle={styles.listContent}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Plugin URL</Text>
            <TextInput
              style={styles.input}
              value={pluginUrl}
              onChangeText={setPluginUrl}
              placeholder="https://example.com/plugin.js"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setPluginUrl('');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.installButton]}
                onPress={handleAddPluginFromUrl}
              >
                <Text style={styles.buttonText}>Install</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  pluginItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  pluginInfo: {
    flex: 1,
  },
  pluginName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pluginVersion: {
    fontSize: 12,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    padding: 10,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ddd',
  },
  installButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

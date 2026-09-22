import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking } from 'react-native';
import { FileText, ExternalLink } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/context/LanguageContext';

interface PdfPlanViewerProps {
  pdfPath: string;
}

export default function PdfPlanViewer({ pdfPath }: PdfPlanViewerProps) {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleOpenPdf = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('nutrition-files')
        .createSignedUrl(pdfPath, 3600);

      if (error) throw error;
      if (data?.signedUrl) {
        const canOpen = await Linking.canOpenURL(data.signedUrl);
        if (canOpen) {
          await Linking.openURL(data.signedUrl);
        } else {
          Alert.alert(
            language === 'en' ? 'Error' : 'Error',
            language === 'en' ? 'Could not open PDF viewer on this device.' : 'No se pudo abrir el lector de PDF en este dispositivo.'
          );
        }
      }
    } catch (err: any) {
      Alert.alert(
        language === 'en' ? 'Error' : 'Error',
        err.message || (language === 'en' ? 'Could not load PDF document.' : 'No se pudo cargar el documento PDF.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <FileText size={28} color="#10b981" />
      </View>

      <View style={styles.infoCol}>
        <Text style={styles.title}>{language === 'en' ? 'Official Dietary Plan (PDF)' : 'Pauta Dietética Oficial (PDF)'}</Text>
        <Text style={styles.subtitle}>{language === 'en' ? 'Signed and prescribed document by your Coach' : 'Documento firmado y prescrito por tu Coach'}</Text>
      </View>

      <TouchableOpacity
        style={styles.openBtn}
        onPress={handleOpenPdf}
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#10b981" />
        ) : (
          <ExternalLink size={18} color="#10b981" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    marginVertical: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoCol: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  openBtn: {
    padding: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
});

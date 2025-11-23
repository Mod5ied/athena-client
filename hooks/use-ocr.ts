// hooks/use-ocr.ts - OCR processing hook with duplicate request prevention
import { useState, useCallback, useRef } from 'react';
import { useNotifications } from './use-notifications';
import { useSessionStore } from './use-store';
import imageCompression from 'browser-image-compression';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

// Base OCR response from backend (only names)
export interface OCRStudentRecord {
  firstName: string;
  lastName: string;
}

// Enhanced student record for frontend use
export interface StudentRecord {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE';
  classLevel?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
}

interface OCRResponse {
  success: boolean;
  data?: {
    students: OCRStudentRecord[];
    total: number;
    processedAt: string;
  };
  message?: string;
  error?: string;
}

interface OCRState {
  isProcessing: boolean;
  students: StudentRecord[];
  error: string | null;
  lastProcessedImage: string | null;
  editingStudentIndex: number | null;
}

export function useOCR() {
  const { showSuccess, showError } = useNotifications();
  const { gradeLevel } = useSessionStore();
  const [state, setState] = useState<OCRState>({
    isProcessing: false,
    students: [],
    error: null,
    lastProcessedImage: null,
    editingStudentIndex: null,
  });

  // Use ref to store processed images to prevent duplicates
  const processedImagesRef = useRef<Set<string>>(new Set());

  // Helper function to compress image for OCR processing
  const compressImageForOCR = useCallback(async (imageData: string): Promise<string> => {
    try {
      // Convert base64 data URL to File object
      const response = await fetch(imageData);
      const blob = await response.blob();
      const originalFile = new File([blob], 'ocr-image.jpg', { type: blob.type });
      
      const originalSizeMB = originalFile.size / 1024 / 1024;
      console.log('✓ Original image size:', originalSizeMB.toFixed(2), 'MB');
      
      // Only compress if larger than 800KB
      if (originalFile.size <= 800 * 1024) {
        console.log('✓ Image size is acceptable, no compression needed');
        return imageData;
      }
      
      console.log('🗜️ Compressing image for OCR...');
      
      const compressionOptions = {
        maxSizeMB: 1.0, // 800KB target
        maxWidthOrHeight: 1920, // Good balance for OCR quality
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 1.0, // Start with high quality for text recognition
        preserveExif: false, // Remove metadata to save space
      };
      
      const compressedFile = await imageCompression(originalFile, compressionOptions);
      const compressedSizeMB = compressedFile.size / 1024 / 1024;
      
      console.log('✓ Image compressed!');
      console.log('✓ Compressed size:', compressedSizeMB.toFixed(2), 'MB');
      console.log('✓ Compression ratio:', ((1 - compressedSizeMB / originalSizeMB) * 100).toFixed(1), '% reduction');
      
      // Convert back to base64 data URL
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(compressedFile);
      });
      
    } catch (error) {
      console.warn('✕ Image compression failed:', error);
      throw new Error('Failed to compress image for processing');
    }
  }, []);

  // Generate a hash from image data to detect duplicates
  const generateImageHash = useCallback((imageData: string): string => {
    // Simple hash using first and last parts of base64 data
    const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
    const start = base64Data.substring(0, 50);
    const end = base64Data.substring(base64Data.length - 50);
    return start + end;
  }, []);

  const processImage = useCallback(async (imageData: string): Promise<StudentRecord[]> => {
    // Generate hash to check for duplicates
    const imageHash = generateImageHash(imageData);
    
    // Check if this image was already processed
    if (processedImagesRef.current.has(imageHash)) {
      showError('Duplicate Image', 'This image has already been processed. Please capture a new image or reset to try again.');
      return state.students; // Return existing students
    }

    setState(prev => ({
      ...prev,
      isProcessing: true,
      error: null,
    }));

    try {
      // Compress image if needed before sending to API
      console.log('✓ Preparing image for OCR processing...');
      const compressedImageData = await compressImageForOCR(imageData);
      
      console.log('✓ Sending image to OCR API...');
      const apiResponse = await fetch(`${BASE_URL}/ocr/student-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: compressedImageData,
        }),
      });

      const result: OCRResponse = await apiResponse.json();

      if (!apiResponse.ok) {
        throw new Error(result.error || `HTTP error! status: ${apiResponse.status}`);
      }

      if (!result.success || !result.data) {
        throw new Error(result.error || 'OCR processing failed');
      }

      const { students: ocrStudents } = result.data;

      // Enhance OCR students with grade level and default values
      const enhancedStudents: StudentRecord[] = ocrStudents.map(ocrStudent => ({
        ...ocrStudent,
        classLevel: gradeLevel || 'Basic_1', // Use session grade level or default
        // Add default values for required backend fields
        gender: 'MALE' as const, // Default, can be changed in UI
        dateOfBirth: new Date().toISOString().split('T')[0], // Default to today, can be changed in UI
      }));

      // Add image hash to processed set to prevent duplicates
      processedImagesRef.current.add(imageHash);

      setState(prev => ({
        ...prev,
        isProcessing: false,
        students: enhancedStudents,
        lastProcessedImage: imageHash,
        error: null,
      }));

      // Show success notification
      if (enhancedStudents.length > 0) {
        showSuccess(
          'OCR Complete', 
          `Successfully extracted ${enhancedStudents.length} student record${enhancedStudents.length !== 1 ? 's' : ''} from the image.`
        );
      } else {
        showError(
          'No Students Found', 
          'No student records were detected in the image. Please ensure the image contains a clear student list and try again.'
        );
      }

      return enhancedStudents;

    } catch (error) {
      console.error('✕ OCR processing error:', error);
      
      let errorMessage = 'Failed to process image';
      let errorTitle = 'OCR Processing Failed';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide specific error messages for common issues
        if (error.message.includes('compress')) {
          errorTitle = 'Image Compression Failed';
          errorMessage = 'Unable to compress the image. Please try with a different image or smaller file size.';
        } else if (error.message.includes('too large') || error.message.includes('3006')) {
          errorTitle = 'Image Too Large';
          errorMessage = 'The image is still too large after compression. Please try with a smaller image.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorTitle = 'Network Error';
          errorMessage = 'Unable to connect to OCR service. Please check your internet connection and try again.';
        }
      }
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
      }));

      showError(errorTitle, errorMessage);
      return [];
    }
  }, [generateImageHash, showSuccess, showError, state.students, gradeLevel, compressImageForOCR]);

  const resetOCR = useCallback(() => {
    setState({
      isProcessing: false,
      students: [],
      error: null,
      lastProcessedImage: null,
      editingStudentIndex: null,
    });
    // Clear the processed images cache when resetting
    processedImagesRef.current.clear();
  }, []);

  const updateStudent = useCallback((index: number, fullName: string) => {
    setState(prev => ({
      ...prev,
      students: prev.students.map((student, i) => {
        if (i === index) {
          const names = fullName.trim().split(' ');
          const firstName = names[0] || '';
          const lastName = names.slice(1).join(' ') || '';
          return { ...student, firstName, lastName };
        }
        return student;
      })
    }));
  }, []);

  const setEditingStudent = useCallback((index: number | null) => {
    setState(prev => ({
      ...prev,
      editingStudentIndex: index
    }));
  }, []);

  const clearStudents = useCallback(() => {
    setState(prev => ({
      ...prev,
      students: [],
      error: null,
    }));
  }, []);

  // Check if an image was already processed
  const isImageProcessed = useCallback((imageData: string): boolean => {
    const imageHash = generateImageHash(imageData);
    return processedImagesRef.current.has(imageHash);
  }, [generateImageHash]);

  return {
    // State
    isProcessing: state.isProcessing,
    students: state.students,
    error: state.error,
    hasStudents: state.students.length > 0,
    editingStudentIndex: state.editingStudentIndex,
    
    // Actions
    processImage,
    resetOCR,
    clearStudents,
    isImageProcessed,
    updateStudent,
    setEditingStudent,
    
    // Utils
    studentsCount: state.students.length,
  };
}
/* eslint-disable @typescript-eslint/no-unused-expressions */
import React, { useEffect, useState, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel, // Import AlertDialogCancel
} from '@/components/ui/alert-dialog';
import axios from 'axios';
import { X } from 'lucide-react'; // Import X icon

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  version: string;
}

const AboutDialog: React.FC<AboutDialogProps> = ({ isOpen, onClose, version }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const handleMouseDown = (event: MouseEvent) => {
        if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
          onClose();
        }
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent ref={contentRef}>
        <AlertDialogHeader>
          <AlertDialogTitle>About SparkyFitness</AlertDialogTitle>
          <AlertDialogDescription>
            <div className="space-y-4">
              <p>SparkyFitness: Built for Families. Powered by AI. Track food, fitness, water, and health — together.</p>
              <p>Application Version: <strong>{version}</strong></p>
              <div>
                Join our community on Discord:{' '}
                <a href="https://discord.gg/vcnMT5cPEA" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  discord.gg/vcnMT5cPEA
                </a>
              </div>
              <div>
                For more information, visit the{' '}
                <a href="https://github.com/CodeWithCJ/SparkyFitness" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  GitHub repository
                </a>.
              </div>
              <div>
                <h3 className="font-semibold mt-2">Technologies Used:</h3>
                <h4 className="font-medium mt-2">Frontend:</h4>
                <ul className="list-disc list-inside text-sm ml-4">
                  <li>React</li>
                  <li>TypeScript</li>
                  <li>Tailwind CSS</li>
                </ul>
                <h4 className="font-medium mt-2">Backend:</h4>
                <ul className="list-disc list-inside text-sm ml-4">
                  <li>Node.js</li>
                  <li>Express</li>
                  <li>PostgreSQL</li>
                </ul>
                <h4 className="font-medium mt-2">External APIs:</h4>
                <ul className="list-disc list-inside text-sm ml-4">
                  <li>Wger API (Exercise Data)</li>
                  <li>
                    Food Data APIs:
                    <ul className="list-disc list-inside ml-4">
                      <li>Nutritionix API</li>
                      <li>FatSecret API</li>
                      <li>Open Food Facts API</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction onClick={onClose}>Got it</AlertDialogAction>
        </AlertDialogFooter>
        <AlertDialogCancel onClick={onClose} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground p-0">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </AlertDialogCancel>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AboutDialog;
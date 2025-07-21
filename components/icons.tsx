import React from 'react';

type IconProps = {
    className?: string;
};

export const CogIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const PlayIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const BeakerIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
);

export const DocumentDuplicateIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

export const ChartBarIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

export const LightBulbIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

export const UserCircleIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const CpuChipIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 21v-1.5M15.75 3v1.5m0 15v1.5M12 4.5v-1.5m0 18v-1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6.75 6.75 0 100-13.5 6.75 6.75 0 000 13.5z" />
    </svg>
);

export const EyeIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

export const ChevronUpIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
);

export const PuzzlePieceIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.69.56-1.25 1.25-1.25h.017a1.25 1.25 0 0 1 1.25 1.25v.017a1.25 1.25 0 0 1-1.25 1.25h-.017A1.25 1.25 0 0 1 14.25 6.087Zm0 0c0 .69-.56 1.25-1.25 1.25h-.017a1.25 1.25 0 0 1-1.25-1.25v-.017a1.25 1.25 0 0 1 1.25-1.25h.017a1.25 1.25 0 0 1 1.25 1.25v.017Zm0 0c.69 0 1.25.56 1.25 1.25v.017a1.25 1.25 0 0 1-1.25 1.25h-.017a1.25 1.25 0 0 1-1.25-1.25v-.017c0-.69.56-1.25 1.25-1.25h.017Zm-1.25 1.25c0 .69.56 1.25 1.25 1.25h.017a1.25 1.25 0 0 1 1.25 1.25v.017a1.25 1.25 0 0 1-1.25 1.25h-.017a1.25 1.25 0 0 1-1.25-1.25v-.017Zm-1.25-1.25c.69 0 1.25.56 1.25 1.25v.017a1.25 1.25 0 0 1-1.25 1.25h-.017a1.25 1.25 0 0 1-1.25-1.25v-.017c0-.69.56-1.25 1.25-1.25h.017Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h.017v.017H8.25V6.75Zm.017.017H8.25v.017h.017v-.017Zm-.017.017H8.25v.017h.017v-.017Zm.017.017H8.25v.017h.017v-.017Zm0 0h-.017v.017h.017v-.017Zm-3-3h.017v.017H5.25V3.75Zm.017.017H5.25v.017h.017V3.767Zm-.017.017H5.25v.017h.017v-.017Zm.017.017H5.25v.017h.017v-.017Zm0 0h-.017v.017h.017v-.017ZM9 3.75h.017v.017H9V3.75Zm.017.017H9v.017h.017V3.767Zm-.017.017H9v.017h.017v-.017Zm.017.017H9v.017h.017v-.017Zm0 0h-.017v.017h.017v-.017Zm-3 3h.017v.017H6V6.75Zm.017.017H6v.017h.017v-.017Zm-.017.017H6v.017h.017v-.017Zm.017.017H6v.017h.017v-.017Zm0 0h-.017v.017h.017v-.017Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.625c0-1.036.84-1.875 1.875-1.875h.375c.621 0 1.125.504 1.125 1.125v.375c0 .621-.504 1.125-1.125 1.125h-.375A1.875 1.875 0 0 1 3 8.625Zm18 0c0-1.036-.84-1.875-1.875-1.875h-.375c-.621 0-1.125.504-1.125 1.125v.375c0 .621.504 1.125 1.125 1.125h.375A1.875 1.875 0 0 0 21 8.625Zm-18 0c0 1.036.84 1.875 1.875 1.875h.375c.621 0 1.125-.504 1.125-1.125v-.375c0-.621-.504-1.125-1.125-1.125h-.375A1.875 1.875 0 0 0 3 8.625Zm18 0c0 1.036-.84 1.875-1.875-1.875h-.375c-.621 0-1.125-.504-1.125-1.125v-.375c0-.621.504 1.125 1.125 1.125h.375A1.875 1.875 0 0 0 21 8.625Zm-1.125-1.125c0-.621.504-1.125 1.125-1.125h.375c1.036 0 1.875.84 1.875 1.875v.375c0 1.036-.84 1.875-1.875 1.875h-.375a1.125 1.125 0 0 1-1.125-1.125v-.375Zm-15.75 0c0-.621.504-1.125 1.125-1.125h.375c1.036 0 1.875.84 1.875 1.875v.375c0 1.036-.84 1.875-1.875 1.875h-.375a1.125 1.125 0 0 1-1.125-1.125v-.375Zm1.125 1.125c0 .621-.504 1.125-1.125 1.125h-.375C3.84 10.5 3 9.66 3 8.625v-.375C3 7.214 3.84 6.375 4.875 6.375h.375c.621 0 1.125.504 1.125 1.125v.375Zm15.75 0c0 .621-.504 1.125-1.125 1.125h-.375c-1.036 0-1.875-.84-1.875-1.875v-.375c0-1.036.84-1.875 1.875-1.875h.375c.621 0 1.125.504 1.125 1.125v.375ZM8.625 3c-1.036 0-1.875.84-1.875 1.875v.375c0 .621.504 1.125 1.125 1.125h.375c.621 0 1.125-.504 1.125-1.125v-.375C11.25 3.84 10.41 3 9.375 3h-.375Zm0 18c-1.036 0-1.875-.84-1.875-1.875v-.375c0-.621.504-1.125 1.125-1.125h.375c.621 0 1.125.504 1.125 1.125v.375c0 1.036-.84 1.875-1.125 1.875h-.375Zm0-18c1.036 0 1.875.84 1.875 1.875v.375c0 .621-.504 1.125-1.125 1.125h-.375c-.621 0-1.125-.504-1.125-1.125v-.375C6.75 3.84 7.59 3 8.625 3h.375Zm0 18c1.036 0 1.875-.84 1.875-1.875v-.375c0-.621-.504-1.125-1.125-1.125h-.375c-.621 0-1.125.504-1.125-1.125v-.375c0-1.036.84-1.875 1.875-1.875h.375Zm1.125-1.125c.621 0 1.125-.504 1.125-1.125v-.375c0-1.036-.84-1.875-1.875-1.875h-.375c-1.036 0-1.875.84-1.875 1.875v.375c0 .621.504 1.125 1.125 1.125h.375ZM8.625 21c1.036 0 1.875-.84 1.875-1.875v-.375c0-.621-.504-1.125-1.125-1.125h-.375c-.621 0-1.125.504-1.125 1.125v.375c0 1.036.84 1.875 1.875 1.875h.375Zm1.125-1.125c.621 0 1.125-.504 1.125-1.125v-.375c0-1.036.84-1.875 1.875-1.875h.375c1.036 0 1.875.84 1.875 1.875v.375c0 .621-.504 1.125-1.125 1.125h-.375a1.125 1.125 0 0 1-1.125-1.125v-.375Z" />
    </svg>
);

export const BookOpenIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
);

export const WrenchScrewdriverIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.878-5.878m0 0L21 5.625A2.652 2.652 0 0 0 17.25 3L11.42 8.828m0 6.342a3 3 0 0 1-4.242-4.242l1.06-1.06a3 3 0 0 1 4.242 0l1.06 1.06a3 3 0 0 1 0 4.242a3 3 0 0 1-4.242 0Z" />
    </svg>
);

export const QuestionMarkCircleIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
    </svg>
);

export const ArrowDownTrayIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

export const ArrowUpTrayIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3v11.25" />
    </svg>
);

export const BoltIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
);
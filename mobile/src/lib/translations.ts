// Translations for the Paperless Hell Fixer app
// Supports Dutch (nl) and Arabic (ar)

export type Language = 'nl' | 'ar';

export type TranslationKey = keyof typeof translations.nl;

export const translations = {
  nl: {
    // App name
    appName: 'Paperless Hell Fixer',
    
    // Loading screen
    loading: 'Laden...',
    
    // Auth screens
    welcomeBack: 'Welkom terug!',
    createAccount: 'Account maken',
    loginToManage: 'Log in om je documenten te beheren',
    createFreeAccount: 'Maak een gratis account aan',
    email: 'E-mailadres',
    emailPlaceholder: 'jouw@email.nl',
    password: 'Wachtwoord',
    passwordPlaceholder: '••••••••',
    confirmPassword: 'Bevestig wachtwoord',
    login: 'Inloggen',
    register: 'Registreren',
    noAccountYet: 'Nog geen account? ',
    alreadyHaveAccount: 'Al een account? ',
    
    // Auth errors
    fillEmailAndPassword: 'Vul je e-mail en wachtwoord in.',
    fillAllFields: 'Vul alle velden in.',
    passwordsDontMatch: 'Wachtwoorden komen niet overeen.',
    passwordMinLength: 'Wachtwoord moet minimaal 6 tekens zijn.',
    emailOrPasswordIncorrect: 'E-mail of wachtwoord onjuist.',
    cannotConnectToServer: 'Kan geen verbinding maken met de server.',
    registrationFailed: 'Registratie mislukt.',
    loginFailed: 'Inloggen mislukt.',
    
    // Success messages
    success: 'Succes! 🎉',
    accountCreated: 'Account aangemaakt! Je kunt nu inloggen.',
    documentUploaded: 'Document geüpload! Het wordt nu verwerkt door AI.',
    
    // Dashboard
    dashboard: 'Dashboard',
    manageYourDocuments: 'Beheer je documenten',
    documents: 'Documenten',
    openActions: 'Open acties',
    urgent: 'Urgent',
    processing: 'Verwerken',
    
    // Upload
    uploadDocument: 'Document uploaden',
    chooseUploadMethod: 'Kies hoe je wilt uploaden',
    camera: 'Camera',
    photoLibrary: 'Foto bibliotheek',
    chooseFile: 'Bestand kiezen',
    cancel: 'Annuleren',
    takePhotoOrChoose: 'Maak een foto of kies uit bibliotheek',
    uploading: 'Uploaden...',
    pdfOrImage: 'PDF of afbeelding (JPG/PNG)',
    upload: 'Upload',
    
    // Permissions
    noAccess: 'Geen toegang',
    cameraAccessRequired: 'Camera toegang is vereist.',
    photoLibraryAccessRequired: 'Fotobibliotheek toegang is vereist.',
    
    // Filters
    open: 'Open',
    done: 'Afgerond',
    all: 'Alles',
    
    // Search
    searchDocuments: 'Zoek documenten...',
    
    // Document types
    typesBelasting: 'Belasting',
    typesBoete: 'Boete',
    typesVerzekering: 'Verzekering',
    typesAbonnement: 'Abonnement',
    typesOverig: 'Overig',
    
    // Document status
    processingDocument: 'Verwerken...',
    failed: 'Mislukt',
    ready: 'Klaar',
    aiProcessing: 'AI verwerkt document...',
    documentBeingProcessed: 'Document wordt verwerkt...',
    processingFailed: 'Verwerking mislukt',
    
    // Document details
    status: 'Status',
    information: 'Informatie',
    sender: 'Afzender',
    senderUnknown: 'Afzender onbekend',
    deadline: 'Deadline',
    amount: 'Bedrag',
    uploaded: 'Geüpload',
    summary: 'Samenvatting',
    documentInfo: 'Document info',
    unknown: 'Onbekend',
    unknownError: 'Onbekende fout',
    retryProcessing: 'Opnieuw proberen',
    
    // Action items
    actionItems: 'Actiepunten',
    actions: 'Acties',
    noActionItems: 'Geen actiepunten',
    noOpenActions: 'Dit document heeft geen openstaande acties',
    noActionsYet: 'Dit document heeft nog geen actiepunten.',
    noActionsFound: 'Geen acties gevonden.',
    greatJob: 'Je hebt geen openstaande acties. Goed bezig! 🎉',
    action: 'actie',
    actionPlural: 'acties',
    completed: 'Afgerond',
    markAsDone: 'Done',
    notes: 'Notities:',
    
    // Empty states
    noDocuments: 'Geen documenten',
    uploadFirstDocument: 'Upload je eerste document om te beginnen',
    
    // Errors
    error: 'Fout',
    notLoggedIn: 'Je bent niet ingelogd.',
    sessionExpired: 'Sessie verlopen',
    loginAgain: 'Log opnieuw in.',
    uploadFailed: 'Upload mislukt.',
    cannotUpload: 'Kan niet uploaden.',
    couldNotLoadDocuments: 'Kon documenten niet laden.',
    documentNotFound: 'Document niet gevonden.',
    couldNotCompleteAction: 'Kon actie niet afronden.',
    retryFailed: 'Retry mislukt.',
    
    // Logout
    logout: 'Uitloggen',
    confirmLogout: 'Weet je zeker dat je wilt uitloggen?',
    
    // From document
    from: 'Van:',
    
    // Language
    language: 'Taal',
    dutch: 'Nederlands',
    arabic: 'العربية',
    selectLanguage: 'Selecteer taal',
    
    // Settings
    settings: 'Instellingen',
  },
  ar: {
    // App name
    appName: 'مُصلح جحيم الأوراق',
    
    // Loading screen
    loading: 'جاري التحميل...',
    
    // Auth screens
    welcomeBack: 'مرحباً بعودتك!',
    createAccount: 'إنشاء حساب',
    loginToManage: 'سجّل الدخول لإدارة مستنداتك',
    createFreeAccount: 'أنشئ حساباً مجانياً',
    email: 'البريد الإلكتروني',
    emailPlaceholder: 'email@example.com',
    password: 'كلمة المرور',
    passwordPlaceholder: '••••••••',
    confirmPassword: 'تأكيد كلمة المرور',
    login: 'تسجيل الدخول',
    register: 'التسجيل',
    noAccountYet: 'ليس لديك حساب؟ ',
    alreadyHaveAccount: 'لديك حساب بالفعل؟ ',
    
    // Auth errors
    fillEmailAndPassword: 'أدخل البريد الإلكتروني وكلمة المرور.',
    fillAllFields: 'يرجى ملء جميع الحقول.',
    passwordsDontMatch: 'كلمات المرور غير متطابقة.',
    passwordMinLength: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.',
    emailOrPasswordIncorrect: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    cannotConnectToServer: 'لا يمكن الاتصال بالخادم.',
    registrationFailed: 'فشل التسجيل.',
    loginFailed: 'فشل تسجيل الدخول.',
    
    // Success messages
    success: 'نجاح! 🎉',
    accountCreated: 'تم إنشاء الحساب! يمكنك الآن تسجيل الدخول.',
    documentUploaded: 'تم رفع المستند! جاري المعالجة بواسطة الذكاء الاصطناعي.',
    
    // Dashboard
    dashboard: 'لوحة التحكم',
    manageYourDocuments: 'إدارة مستنداتك',
    documents: 'المستندات',
    openActions: 'إجراءات مفتوحة',
    urgent: 'عاجل',
    processing: 'قيد المعالجة',
    
    // Upload
    uploadDocument: 'رفع مستند',
    chooseUploadMethod: 'اختر طريقة الرفع',
    camera: 'الكاميرا',
    photoLibrary: 'مكتبة الصور',
    chooseFile: 'اختيار ملف',
    cancel: 'إلغاء',
    takePhotoOrChoose: 'التقط صورة أو اختر من المكتبة',
    uploading: 'جاري الرفع...',
    pdfOrImage: 'PDF أو صورة (JPG/PNG)',
    upload: 'رفع',
    
    // Permissions
    noAccess: 'لا يوجد وصول',
    cameraAccessRequired: 'يلزم الوصول إلى الكاميرا.',
    photoLibraryAccessRequired: 'يلزم الوصول إلى مكتبة الصور.',
    
    // Filters
    open: 'مفتوح',
    done: 'مكتمل',
    all: 'الكل',
    
    // Search
    searchDocuments: 'البحث في المستندات...',
    
    // Document types
    typesBelasting: 'ضريبة',
    typesBoete: 'غرامة',
    typesVerzekering: 'تأمين',
    typesAbonnement: 'اشتراك',
    typesOverig: 'أخرى',
    
    // Document status
    processingDocument: 'جاري المعالجة...',
    failed: 'فشل',
    ready: 'جاهز',
    aiProcessing: 'الذكاء الاصطناعي يعالج المستند...',
    documentBeingProcessed: 'جاري معالجة المستند...',
    processingFailed: 'فشلت المعالجة',
    
    // Document details
    status: 'الحالة',
    information: 'المعلومات',
    sender: 'المرسل',
    senderUnknown: 'المرسل غير معروف',
    deadline: 'الموعد النهائي',
    amount: 'المبلغ',
    uploaded: 'تم الرفع',
    summary: 'الملخص',
    documentInfo: 'معلومات المستند',
    unknown: 'غير معروف',
    unknownError: 'خطأ غير معروف',
    retryProcessing: 'إعادة المحاولة',
    
    // Action items
    actionItems: 'بنود العمل',
    actions: 'الإجراءات',
    noActionItems: 'لا توجد بنود عمل',
    noOpenActions: 'هذا المستند ليس له إجراءات معلقة',
    noActionsYet: 'هذا المستند ليس له بنود عمل بعد.',
    noActionsFound: 'لم يتم العثور على إجراءات.',
    greatJob: 'ليس لديك إجراءات معلقة. أحسنت! 🎉',
    action: 'إجراء',
    actionPlural: 'إجراءات',
    completed: 'مكتمل',
    markAsDone: 'تم',
    notes: 'ملاحظات:',
    
    // Empty states
    noDocuments: 'لا توجد مستندات',
    uploadFirstDocument: 'ارفع مستندك الأول للبدء',
    
    // Errors
    error: 'خطأ',
    notLoggedIn: 'لم تقم بتسجيل الدخول.',
    sessionExpired: 'انتهت الجلسة',
    loginAgain: 'سجّل الدخول مرة أخرى.',
    uploadFailed: 'فشل الرفع.',
    cannotUpload: 'لا يمكن الرفع.',
    couldNotLoadDocuments: 'تعذر تحميل المستندات.',
    documentNotFound: 'المستند غير موجود.',
    couldNotCompleteAction: 'تعذر إكمال الإجراء.',
    retryFailed: 'فشلت إعادة المحاولة.',
    
    // Logout
    logout: 'تسجيل الخروج',
    confirmLogout: 'هل أنت متأكد أنك تريد تسجيل الخروج؟',
    
    // From document
    from: 'من:',
    
    // Language
    language: 'اللغة',
    dutch: 'الهولندية',
    arabic: 'العربية',
    selectLanguage: 'اختر اللغة',
    
    // Settings
    settings: 'الإعدادات',
  },
} as const;

// Type labels for document types in both languages
export const typeLabelsTranslated = {
  nl: {
    BELASTING: { label: 'Belasting', emoji: '🏛️', color: '#6366f1' },
    BOETE: { label: 'Boete', emoji: '⚠️', color: '#ef4444' },
    VERZEKERING: { label: 'Verzekering', emoji: '🛡️', color: '#10b981' },
    ABONNEMENT: { label: 'Abonnement', emoji: '📅', color: '#f59e0b' },
    OVERIG: { label: 'Overig', emoji: '📄', color: '#6b7280' },
  },
  ar: {
    BELASTING: { label: 'ضريبة', emoji: '🏛️', color: '#6366f1' },
    BOETE: { label: 'غرامة', emoji: '⚠️', color: '#ef4444' },
    VERZEKERING: { label: 'تأمين', emoji: '🛡️', color: '#10b981' },
    ABONNEMENT: { label: 'اشتراك', emoji: '📅', color: '#f59e0b' },
    OVERIG: { label: 'أخرى', emoji: '📄', color: '#6b7280' },
  },
} as const;

// Month names for date formatting
export const monthNames = {
  nl: {
    short: ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'],
    long: ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'],
  },
  ar: {
    short: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    long: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  },
} as const;

// Helper function to format dates in the selected language
export const formatDate = (dateStr: string | null, language: Language): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = monthNames[language].short;
  return `${d.getDate()} ${months[d.getMonth()]}`;
};

export const formatFullDate = (dateStr: string | null, language: Language): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = monthNames[language].long;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

// Check if language is RTL
export const isRTL = (language: Language): boolean => language === 'ar';


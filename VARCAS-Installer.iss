#define MyAppName "VARCAS Automobiles QC Management System"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "VARCAS Automobiles"
#define MyAppExeName "Start-VARCAS.cmd"

[Setup]
AppId={{A7D3B4E1-6C28-4D5A-9F21-8B5E7C4A1D93}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\VARCAS QC Management System
DefaultGroupName={#MyAppName}
OutputDir=installer-output
OutputBaseFilename=VARCAS-QC-Management-Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible

[Files]
Source: "client\dist\*"; DestDir: "{app}\client\dist"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "server\*"; DestDir: "{app}\server"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "runtime\node.exe"; DestDir: "{app}\runtime"; Flags: ignoreversion
Source: "Start-VARCAS.cmd"; DestDir: "{app}"; Flags: ignoreversion
Source: "qc_management_system.sql"; DestDir: "{app}\database"; Flags: ignoreversion
Source: "mysql\*"; DestDir: "{app}\mysql"; Flags: ignoreversion recursesubdirs createallsubdirs 
[Icons]
Name: "{group}\VARCAS QC Management System"; Filename: "{app}\Start-VARCAS.cmd"
Name: "{commondesktop}\VARCAS QC Management System"; Filename: "{app}\Start-VARCAS.cmd"

[Run]
Filename: "{app}\Start-VARCAS.cmd"; Description: "Start VARCAS QC Management System"; Flags: postinstall nowait skipifsilent
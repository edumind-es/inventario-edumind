Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")
base = fso.GetParentFolderName(WScript.ScriptFullName)
sh.CurrentDirectory = base

' Control: si se hace doble clic en este archivo SIN extraer el ZIP, Windows
' copia solo este .vbs a una carpeta temporal y el resto del paquete no existe.
' Sin este aviso el usuario ve el error críptico 80070002 de Windows.
nodeExe = base & "\runtime\node.exe"
If Not fso.FileExists(nodeExe) Then
  MsgBox "No se encuentra el programa (falta la carpeta runtime)." & vbCrLf & vbCrLf & _
         "Parece que has abierto el ZIP sin extraerlo." & vbCrLf & vbCrLf & _
         "Qué hacer:" & vbCrLf & _
         "1. Cierra este aviso y vuelve a la ventana del ZIP." & vbCrLf & _
         "2. Pulsa ""Extraer todo"" y elige una carpeta normal" & vbCrLf & _
         "   (por ejemplo Documentos o el Escritorio)." & vbCrLf & _
         "3. Entra en la carpeta ya extraída y haz doble clic aquí de nuevo." & vbCrLf & vbCrLf & _
         "Carpeta desde la que se ha ejecutado:" & vbCrLf & base, _
         vbExclamation, "Inventario EDUmind"
  WScript.Quit 1
End If

dataDir = sh.ExpandEnvironmentStrings("%APPDATA%") & "\InventarioEDUmind"
urlfile = dataDir & "\url.txt"
On Error Resume Next
fso.DeleteFile urlfile
On Error GoTo 0
sh.Run """" & nodeExe & """ --experimental-sqlite scripts\run.mjs", 0, False
Dim i
For i = 1 To 40
  If fso.FileExists(urlfile) Then
    Dim ts, url
    Set ts = fso.OpenTextFile(urlfile, 1)
    url = Trim(ts.ReadAll)
    ts.Close
    sh.Run """" & url & """", 1, False
    Exit For
  End If
  WScript.Sleep 500
Next

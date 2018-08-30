var FSO = new ActiveXObject("Scripting.FileSystemObject");
var wshShell = new ActiveXObject("WScript.Shell");
checkScript();

String.prototype.startsWith=new Function("str","return(this.substr(0,str.length) === str);");

with (WScript)
{
	StdOut.WriteLine("Enter letters of the drives which you");
	StdOut.WriteLine("want to move the folder from.");
	StdOut.WriteLine("Example: CFGH");
	var driveLetters = StdIn.ReadLine().toUpperCase();
	StdOut.WriteLine("Please wait...");
	
	var destinationDrive = "";
	var offset = driveLetters.indexOf("->");
	if (offset >= 0)
	{
		destinationDrive = driveLetters.charAt(offset + 2);
		driveLetters = driveLetters.substr(0, offset);
	}
	
	if (!driveLetters)
		driveLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	
	var sourceDrives = "";
	var winDrv = FSO.GetSpecialFolder(0).Drive.DriveLetter.toUpperCase();
	for (var i = 0;i < driveLetters.length;i++)
	{
		if (driveLetters.charAt(i) == winDrv)
			continue;
		if (sourceDrives.indexOf(driveLetters.charAt(i)) >= 0)
			continue;
		if (FSO.DriveExists(driveLetters.charAt(i)))
			sourceDrives += driveLetters.charAt(i);
	}
	
	var destinationPaths = [];
	if (destinationDrive)
	{
		for (i = 0;i < sourceDrives.length;i++)
			destinationPaths.push(destinationDrive + ":\\SVI on Volume " + sourceDrives.charAt(i));
	}
	else
		for (i = 0;i < sourceDrives.length;i++)
		{
			StdOut.WriteLine("Enter the path of the folder where you want to");
			StdOut.WriteLine("move '" + sourceDrives.charAt(i) + ":\\System Volume Information'.");
			destinationPaths[i] = StdIn.ReadLine();
		}
	
	var tmpFolder = FSO.GetSpecialFolder(2);
	var tmpBat = FSO.GetTempName().replace(".tmp", ".bat");
	var ts = tmpFolder.CreateTextFile(tmpBat);
	
	for (i = 0;i < sourceDrives.length;i++)
	{
		var $path = sourceDrives.charAt(i) + ":\\System Volume Information";
		ts.WriteLine("Echo Drive" + i);
		ts.WriteLine('takeown /f "' + $path + '" /a /r /d y');
		ts.WriteLine('icacls "' + $path + '" /t /c /grant administrators:F System:F everyone:F');
		ts.WriteLine("Y");
		ts.WriteLine('rmdir /s /q "' + $path + '"');
		ts.WriteLine('mklink /J "' + $path + '" "' + destinationPaths[i] + '"');
	}
	
	ts.WriteLine("echo constructSVI");
	ts.WriteLine("taskkill /f /im explorer.exe");
	ts.WriteLine("start explorer.exe");
	ts.WriteLine("echo Accomplished");
	ts.Close();
	
	var batPath = tmpFolder.Files.Item(tmpBat).Path;
	
	StdOut.WriteLine("Now, this program is ready to perform the operation.");
	StdOut.WriteLine("Press Enter to continue.");
	StdIn.SkipLine();
	
	var bat = wshShell.Exec(batPath);
	do
	{
		var line = bat.StdOut.ReadLine();
		if (line.startsWith("Drive"))
		{
			var drvIndex = parseInt(line.replace("Drive", ""));
			StdOut.WriteLine("Moving " + sourceDrives.charAt(drvIndex) + ":\\System Volume Information");
			StdOut.WriteLine("To " + destinationPaths[drvIndex]);
		}
		else if (line == "constructSVI")
			StdOut.WriteLine("Recreating SVIs...");
	} while (line != "Accomplished")
	
	StdOut.WriteLine("Done! Press Enter to quit.");
	StdIn.SkipLine();
	
	FSO.DeleteFile(batPath);
}

function checkScript()
{
	if (FSO.GetBaseName(WScript.FullName).toLowerCase() != "cscript")
	{
		wshShell.Run('cscript "' + WScript.ScriptFullName + '"');
		WScript.Quit();
	}
}

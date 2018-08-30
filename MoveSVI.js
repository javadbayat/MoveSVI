var FSO = new ActiveXObject("Scripting.FileSystemObject");
var wshShell = new ActiveXObject("WScript.Shell");
//Check if the script is ran by wscript.exe. If so,
//Run that again with cscript.exe
checkScript();

String.prototype.startsWith=new Function("str","return(this.substr(0,str.length) === str);");

with (WScript)
{
	StdOut.WriteLine("Enter letters of the drives which you");
	StdOut.WriteLine("want to move the folder from.");
	StdOut.WriteLine("Example: CFGH");
	var driveLetters = StdIn.ReadLine().toUpperCase();
	StdOut.WriteLine("Please wait...");
	
	//Parse the driveLetters string and separate it by "->"
	var destinationDrive = "";
	var offset = driveLetters.indexOf("->");
	if (offset >= 0)
	{
		destinationDrive = driveLetters.charAt(offset + 2);
		driveLetters = driveLetters.substr(0, offset);
	}
	
	//If the user hasn't entered any drive letters to be used
	//as source drives, set the driveLetters variable to the
	//letters of all drives.
	
	if (!driveLetters)
		driveLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	
	//So far we have some raw drive letters stored in driveLetters
	//variable. But we should notice some possible issues of the
	//string stored in driveLetters variable, such as:
	//1. One of the drive letters might be mistakenly replicated.
	//2. One of the drive letters might correspond to a drive 
	//   that does not exist.
	//3. One of the drive letters might correspond to the Windows
	//   drive.
	//Thus, we define an another variable named sourceDrives and 
	//store the acceptable drive letters in that.
	
	var sourceDrives = "";
	var winDrv = FSO.GetSpecialFolder(0).Drive.DriveLetter.toUpperCase();
	for (var i = 0;i < driveLetters.length;i++)
	{
		//If the drive is the windows drive, ignore it.
		if (driveLetters.charAt(i) == winDrv)
			continue;
		//If the drive letter is a duplicate, ignore it.
		if (sourceDrives.indexOf(driveLetters.charAt(i)) >= 0)
			continue;
		//Then if the drive exists, add it to the sourceDrives
		//variable as an acceptable drive.
		if (FSO.DriveExists(driveLetters.charAt(i)))
			sourceDrives += driveLetters.charAt(i);
	}
	
	//Now we have some acceptable drive letters stored in 
	//sourceDrives. Anyway, here an array named destinationPaths
	//is defined. Each elements in this array corresponds to 
	//one of the source drives and indicates where the SVI 
	//folder in that drive must be moved to.
	
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
	
	//Now, we reached the kernel of this program!
	//Here we create a bat file in the temporary
	//folder which carries out the command required
	//to move the folder.
	var tmpFolder = FSO.GetSpecialFolder(2);
	var tmpBat = FSO.GetTempName().replace(".tmp", ".bat");
	var ts = tmpFolder.CreateTextFile(tmpBat);
	
	for (i = 0;i < sourceDrives.length;i++)
	{
		//Variable to store the path of the SVI folder
		//inside the source drive.
		var $path = sourceDrives.charAt(i) + ":\\System Volume Information";
		//Write a token (e.g. Drive5) used for tracking progress.
		ts.WriteLine("Echo Drive" + i);
		//Take the ownership.
		ts.WriteLine('takeown /f "' + $path + '" /a /r /d y');
		//Deal with permissions.
		ts.WriteLine('icacls "' + $path + '" /t /c /grant administrators:F System:F everyone:F');
		//Answer Y when prompted "Are you sure?"
		ts.WriteLine("Y");
		//Remove SVI folder.
		ts.WriteLine('rmdir /s /q "' + $path + '"');
		//Replace it with a directory junction.
		ts.WriteLine('mklink /J "' + $path + '" "' + destinationPaths[i] + '"');
	}
	
	ts.WriteLine("echo constructSVI");
	//Restart explorer.exe. According to my discovery,
	//doing so causes the operating system to recreate
	//System Volume Information folders.
	ts.WriteLine("taskkill /f /im explorer.exe");
	ts.WriteLine("start explorer.exe");
	ts.WriteLine("echo Accomplished");
	ts.Close();
	
	//Obtain the path of the bat file.
	var batPath = tmpFolder.Files.Item(tmpBat).Path;
	
	StdOut.WriteLine("Now, this program is ready to perform the operation.");
	StdOut.WriteLine("Press Enter to continue.");
	StdIn.SkipLine();
	
	//Execute the bat file and track the progress.
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
	
	//Delete the temporary bat file.
	FSO.DeleteFile(batPath);
}

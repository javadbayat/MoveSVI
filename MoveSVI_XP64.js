var FSO = new ActiveXObject("Scripting.FileSystemObject");
var wshShell = new ActiveXObject("WScript.Shell");
//Check if the script is ran by wscript.exe. If so,
//Run that again with cscript.exe
checkScript();

String.prototype.startsWith = new Function("str", "return(this.substr(0, str.length) === str);");
var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

with (WScript)
{
	StdOut.WriteLine("Enter the MoveSVI command:");
	var driveLetters = StdIn.ReadLine().toUpperCase();
	StdOut.WriteLine("Please wait...");
	
	//Parse the driveLetters string and separate it by "->"
	var destinationFolder = "";
	var offset = driveLetters.indexOf("->");
	if (offset >= 0)
	{
		destinationFolder = driveLetters.substr(offset + 2);
		if (FSO.DriveExists(destinationFolder))
			destinationFolder = destinationFolder.charAt(0) + ":\\";
		else if (!FSO.FolderExists(destinationFolder))
		{
			StdErr.WriteLine("Error: Could not find folder '" + destinationFolder + "'.");
			StdOut.Write("Press Enter to quit.");
			StdIn.SkipLine();
			WScript.Quit();
		}
		driveLetters = driveLetters.substr(0, offset);
	}
	
	//If the user hasn't entered any drive letters to be used
	//as source drives, set the driveLetters variable to the
	//letters of all drives.
	
	if (!driveLetters)
		driveLetters = alphabet;
	
	//So far we have some raw drive letters stored in driveLetters
	//variable. But we should notice some possible issues of the
	//string stored in driveLetters variable, such as:
	//1. One of the drive letters might be mistakenly replicated.
	//2. One of the drive letters might correspond to a drive 
	//   that does not exist.
	//Also, the user might have prepended "!" to the drive letters.
	//This means, all drives except these drive letters. So we
	//should consider this.
	//Thus, we define an another variable named sourceDrives and 
	//store the acceptable drive letters in that.
	
	var sourceDrives = "";
	if (driveLetters.charAt(0) == "!")
	{
		//Check for drives other than the drive letters
		//that the user has entered.
		for (var i = 0;i < alphabet.length;i++)
		{
			var drv = alphabet.charAt(i);
			if (!FSO.DriveExists(drv))
				continue;
			
			//If it comes here, we have an existing drive
			//whose letter is stored in drv variable. Now
			//check if drv doesn't reside in driveLetters
			//variable.
			if (driveLetters.indexOf(drv) >= 0)
				continue;
			
			//Check if drv is a hard disk drive
			if (FSO.GetDrive(drv).DriveType != 2)
				continue;
			
			//Add drv to the list of source drives.
			sourceDrives += drv;
		}
	}
	else
		//Check for valid drives in driveLetters variable.
		for (var i = 0;i < driveLetters.length;i++)
		{
			//If the drive letter is a duplicate, ignore it.
			if (sourceDrives.indexOf(driveLetters.charAt(i)) >= 0)
				continue;
			//Then if the drive exists, add it to the sourceDrives
			//variable as an acceptable drive.
			if (FSO.DriveExists(driveLetters.charAt(i)) && (FSO.GetDrive(driveLetters.charAt(i)).DriveType == 2))
				sourceDrives += driveLetters.charAt(i);
		}
	
	//Now we have some acceptable drive letters stored in 
	//sourceDrives. Anyway, here an array named destinationPaths
	//is defined. Each elements in this array corresponds to 
	//one of the source drives and indicates where the SVI 
	//folder in that drive must be moved to.
	
	var destinationPaths = [];
	if (destinationFolder)
	{
		for (i = 0;i < sourceDrives.length;i++)
			destinationPaths.push(FSO.BuildPath(destinationFolder, "SVI on Volume " + sourceDrives.charAt(i)));
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
	//folder which carries out the commands required
	//to move the folders.
	var tmpFolder = FSO.GetSpecialFolder(2);
	var tmpBat = FSO.GetTempName().replace(".tmp", ".bat");
	var ts = tmpFolder.CreateTextFile(tmpBat);
	ts.WriteLine("sc stop cisvc");
	
	for (i = 0;i < sourceDrives.length;i++)
	{
		//Variable to store the path of the SVI folder
		//inside the source drive.
		var sviPath = sourceDrives.charAt(i) + ":\\System Volume Information";
		//If SVI folder does not exist in the source
		//drive, display an error and discard that drive.
		if (!FSO.FolderExists(sviPath))
		{
			StdErr.WriteLine("Error: Could not find " + sviPath);
			continue;
		}
		//Write a token (e.g. Drive5) used for tracking progress.
		ts.WriteLine("Echo Drive" + i);
		//Deal with permissions.
		ts.WriteLine('cacls "' + sviPath + '" /t /c /g administrators:F System:F everyone:F');
		//Create a new pseudo SVI folder.
		ts.WriteLine('md "' + destinationPaths[i] + '"');
		//Remove the old SVI folder.
		ts.WriteLine('rmdir /s /q "' + sviPath + '"');
		//Replace it with a directory junction.
		ts.WriteLine('"' + FSO.GetAbsolutePathName("junction64.exe") + '" "' + sviPath + '" "' + destinationPaths[i] + '"');
		//Remove the pseudo folder.
		ts.WriteLine('rmdir /s /q "' + destinationPaths[i] + '"');
	}
	
	ts.WriteLine("sc start cisvc");
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
	
	//Display a message
	StdOut.WriteLine("Executing batch file '" + batPath + "'...");
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
			//Answer Y when prompted Are you sure?
			bat.StdIn.WriteLine("Y");
		}
		else if (line == "constructSVI")
			StdOut.WriteLine("Recreating SVIs...");
	} while (line != "Accomplished")
	
	StdOut.WriteLine("Done! Press Enter to quit.");
	StdIn.SkipLine();
	
	//Delete the temporary bat file.
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

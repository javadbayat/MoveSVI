# MoveSVI
Move System Volume Information folder to another location!

Does your System Volume Information folder on your external hard drive (not flash drive) take up lots of space on your computer?
Want to move it to an another location? Then you're in the right place! For the first time, I made it possible to change the location of this folder! But you cannot move this folder from the drive where your Windows is installed.

In this page, the following terms are used:
1. *SVI*: Contraction of System Volume Information folder.
2. *Source drives*: The drives from which SVI is moved.
3. *Destination drives*: The drives that SVI is being, or has been moved to.

Take the following instructions:

1. Turn off System Restore for all drives. After accomplishing these instructions, you can turn it on again.

2. Download the moveSVI.js script from this repository. Run the script by right-clicking on moveSVI.js and selecting Windows Script Host. You can also run the script by double-clicking on moveSVI.js, provided that the file isn't opened in any text-editor, like Notepad.

3. Then, the program will run in a *console*, that is, a window with a totally black screen and white text, like DOS. Imagine you want to move System Volume Information from all drives into drive E. Then type the following command and press Enter.

    ->E

Or, if you want to move them from just some of the drives (e.g. only drives C:, H:, and L:) into drive E:, type this:

    CHL->E

Note that you cannot move SVI from the drive where your Windows is installed.

4. Next, wait until you get the message "Done! Press Enter to quit.". After that, press Enter to close the app. Now you can turn on System Restore on your desired drives.

5. Now, if you take a look at your source drives, you will see an item named "System Volume Information" which seems like a shortcut. But it's not actually a shortcut. It's called a *directory junction*. Don't worry, it doesn't take up even one byte on your disk. The actual and original SVI folder is stored in the destination drive.

If you have a look at your destination drive, you will see the SVI folders, as follows:

    SVI on Volume C
    SVI on Volume D
    SVI on Volume G
    ...and so on

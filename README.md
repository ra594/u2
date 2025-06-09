# Instagram Follower Analyzer

This tool compares the follower and following lists from your Instagram data.

## Using the App

1. Upload your first Instagram ZIP using the form on the main page. The ZIP
   filename should look like `instagram-<username>-YYYY-MM-DD-*.zip`.
2. After the results are displayed, click **Upload New Data** to add additional ZIP files whenever you have a new snapshot.
3. Each upload is stored as a run using the creation date embedded in the ZIP
   metadata (not the filename). If you upload a file with the same creation
   timestamp as a previous run, the app will alert "Datapoint already exists" and
   skip it.
4. Runs are ordered chronologically by their creation date. Uploading an older
   ZIP will not replace your most recent results, but the data is kept so new
   items are determined relative to the previous snapshot.
5. New entries that didn't exist in the prior run are marked with a **NEW**
   badge in the results pages.
6. Click **Clear Data** to remove all stored runs and reset both upload forms.


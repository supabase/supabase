It looks like you've provided two different README files, one for a "Bible: XML + SQL + JSON" project and another for "Supabase." It seems like the intention is to correct or merge parts of the first one ("Bible: XML + SQL + JSON").

I will focus on correcting and improving the "Bible: XML + SQL + JSON" README based on common README best practices and clarity. The "Supabase" content appears to be a complete and separate README, so I won't be integrating it unless you specifically request parts of it to be incorporated.

Here's a revised version of your "Bible: XML + SQL + JSON" README, incorporating standard Markdown practices, improving readability, and making minor corrections:

-----

# Bible: XML + SQL + JSON

This project aims to democratize access to the **Holy Bible in Brazilian Portuguese** for programmers, developers, and anyone interested in proclaiming the Gospel and the good news of the Kingdom of God through technology.

Did you find this project helpful? You can support us in going even further by making a contribution via PayPal.

[](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=A9FM66AQT672L&lc=BR&item_name=Bible%20Sources&currency_code=BRL&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted)

-----

## What Bible Versions Are Included?

Currently, this project includes three versions of the Holy Bible in Brazilian Portuguese (pt-BR):

  * **New International Version (NIV)**
  * **King James Version (ACF)**
  * **King James Version Revised Bible Press (AA)**

-----

## Available File Formats

The Bible versions are available in three common formats:

  * **XML**
  * **SQL**
  * **JSON**

### XML

Each Bible version has its own XML file. These files are **UTF-8 encoded** and follow this structure:

```xml
<book>
  <chapter>
    <verse>Text</verse>
  </chapter>
</book>
```

There are also minimal files containing all the books for each version.

### SQL

Each Bible version has its own SQL file. These SQL files are **UTF-8 encoded** and include the following:

  * Creation of the `'testament'` table
  * Creation of the `'books'` table
  * Population of both `'testament'` and `'books'` tables
  * Creation of the `'verses'` table
  * Population of the `'verses'` table with the biblical texts

The `'verses'` table is structured as follows:

  * `id`: The unique identifier for the verse.
  * `version`: The version of the Bible (e.g., NIV, ACF, AA).
  * `testament`: The identification of the testament (1 for Old Testament, 2 for New Testament).
  * `book`: The identification of the book of the Bible (1-66).
  * `chapter`: The chapter number.
  * `verse`: The verse number.
  * `text`: The actual text of the verse.

### JSON

Each Bible version has its own JSON file. These JSON files are **UTF-8 encoded** and have the following structure:

```javascript
[
  {
    "abbrev": "abbrev",
    "book": "name",
    "chapters": [
      ["Text of verse 1", "Text of verse 2", "Text of verse 3", "..."],
      ["Text of verse 1", "Text of verse 2", "Text of verse 3", "..."],
      ["Text of verse 1", "Text of verse 2", "Text of verse 3", "..."]
    ]
  }
]
```

The chapter and verse numbers can be retrieved using array indices.

-----

## How Were the Files Compiled?

The compilation of these files was achieved through web page crawling. While unlikely, it's possible that minor collection errors may exist.

-----

## Versions in Other Languages

Yes, we also have Bible versions in many other languages\! You can preview them by visiting our main project: [Bible: XML + JSON](https://github.com/thiagobodruk/bible).

-----

## Licenses and Entitlements

This project is distributed under the **Creative Commons BY-NC license**. The Bible translations included in this project are the intellectual property of their respective authors:

  * **New International Version (NIV)**: International Bible Society
  * **King James Version (ACF)**: Trinitarian Bible Society
  * **King James Version Revised Bible Press (AA)**: Brazilian Bible Press

All rights are reserved to these authors.

-----

## How Can You Contribute?

Help us deliver quality content by reviewing the code and suggesting optimized structures. All help is welcome\! :)

-----

## Support the Project

Yes, you can make a voluntary donation through [PayPal](https://www.google.com/search?q=https://www.paypal.com/cgi-bin/webscr%3Fcmd%3D_donations%26business%3DA9FM66AQT672L%26lc%3DBR%26item_name%3DBible%2520Sources%26currency_code%3DBRL%26bn%3DPP%252dDonationsBF%253abtn_donateCC%255fLG%252egif%253aNonHosted).

[](https://www.google.com/search?q=%5Bhttps://www.paypal.com/cgi-bin/webscr%3Fcmd%3D_donations%26business%3DA9FM66AQT672L%26lc%3DBR%26item_name%3DBible%2520Sources%26currency_code%3DBRL%26bn%3DPP%252dDonationsBF%253abtn_donateCC%255fLG%252egif%253aNonHosted%5D\(https://www.paypal.com/cgi-bin/webscr%3Fcmd%3D_donations%26business%3DA9FM66AQT672L%26lc%3DBR%26item_name%3DBible%2520Sources%26currency_code%3DBRL%26bn%3DPP%252dDonationsBF%253abtn_donateCC%255fLG%252egif%253aNonHosted\))

-----
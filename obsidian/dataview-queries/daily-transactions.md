```dataview
TABLE amount, category, account, notes
FROM "transactions"
WHERE date = this.file.day
SORT date DESC
```

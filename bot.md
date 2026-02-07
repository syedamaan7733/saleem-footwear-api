# Bot API Documentation

This document describes the API endpoints exposed for the chatbot and UI integration.

## Base URL
```
http://localhost:8000
```

## Endpoints

### 1. Get Categories

Retrieves a paginated list of unique product categories with representative images.

**Endpoint:** `GET /bot/categories`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 10 | Number of categories per page |

**Response Format:**
```json
{
  "categories": [
    {
      "name": "MAX",
      "imageUrl": "https://res.cloudinary.com/..."
    },
    {
      "name": "GENTS V-SHAPE",
      "imageUrl": "https://res.cloudinary.com/..."
    }
  ],
  "meta": {
    "total": 23,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

**Example Request:**
```bash
curl "http://localhost:8000/bot/categories?page=1&limit=10"
```

**Notes:**
- Categories are sorted by the latest product creation date (most recent first)
- Each category shows the first image from its most recently added product
- Use pagination to load more categories

---

### 2. Get Category Items

Retrieves products for a specific category, with each color variant returned as a separate item.

**Endpoint:** `GET /bot/categories/:category`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Category name (case-insensitive) |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 20 | Number of items per page |

**Response Format:**
```json
{
  "items": [
    {
      "_id": "69848d50bf8bdcfc5faffc51",
      "imageUrl": "https://res.cloudinary.com/...",
      "article": "95167",
      "category": "MAX",
      "brand": "PARAGON",
      "color": "TAN",
      "material": "AIRMIX SOLE"
    },
    {
      "_id": "69848d50bf8bdcfc5faffc51",
      "imageUrl": "https://res.cloudinary.com/...",
      "article": "95167",
      "category": "MAX",
      "brand": "PARAGON",
      "color": "BLK",
      "material": "AIRMIX SOLE"
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

**Example Request:**
```bash
curl "http://localhost:8000/bot/categories/MAX?page=1&limit=20"
```

**Notes:**
- Products are "exploded" by color - each color variant appears as a separate item
- The `imageUrl` corresponds to the first image of that specific color variant
- Items are sorted by creation date (newest first)
- The `_id` is the same for all color variants of the same product
- Category name matching is case-insensitive

---

## Integration Guide

### Chatbot Flow

1. **Initial Greeting**
   - When user greets the bot, call `/bot/categories?page=1&limit=9`
   - Display 9 categories as clickable options
   - Show a "More" button if `meta.totalPages > 1`

2. **Load More Categories**
   - When user clicks "More", increment page number
   - Call `/bot/categories?page=2&limit=9`
   - Display additional categories
   - Hide "More" button when `meta.page === meta.totalPages`

3. **Category Selection**
   - When user selects a category, call `/bot/categories/{categoryName}?page=1&limit=20`
   - Display product items with images and details
   - Show pagination controls if `meta.totalPages > 1`

### UI Integration

The category items endpoint can be used directly in the UI for:
- Product listing pages filtered by category
- Search results within a category
- Category-specific product galleries

### Error Handling

All endpoints return standard HTTP status codes:
- `200 OK` - Successful request
- `500 Internal Server Error` - Server error

Error response format:
```json
{
  "msg": "Error message description"
}
```

---

## Data Model

### Category Object
```typescript
{
  name: string;        // Category name
  imageUrl: string;    // Representative image URL
}
```

### Item Object
```typescript
{
  _id: string;         // Product ID (MongoDB ObjectId)
  imageUrl: string;    // First image of this color variant
  article: string;     // Product article/SKU number
  category: string;    // Category name
  brand: string;       // Brand name
  color: string;       // Color name (e.g., "TAN", "BLK")
  material: string;    // Material type (e.g., "AIRMIX SOLE")
}
```

### Pagination Metadata
```typescript
{
  total: number;       // Total number of items
  page: number;        // Current page number
  limit: number;       // Items per page
  totalPages: number;  // Total number of pages
}
```

---

## Performance Considerations

- All endpoints use MongoDB aggregation pipelines for optimal performance
- Database indexes are in place for `category`, `brand`, `material`, and `createdAt` fields
- Pagination is implemented to prevent large data transfers
- Recommended page limits:
  - Categories: 9-10 items (for chatbot UI)
  - Items: 20-50 items (for product listings)

---

## Version History

- **v2.1.0** - Current version
  - Refactored to use Product model
  - Added color explosion for category items
  - Added brand, color, and material fields to items
  - Optimized with database indexes

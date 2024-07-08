import * as graphql from "https://deno.land/x/graphql_request@v4.1.0/mod.ts";

export type Area = {
  id: number;
  name: string;
  country: string;
};

export async function area(query: string): Promise<Area> {
  const data = await graphql.request(
    "https://ra.co/graphql",
    graphql.gql`
      query($query: String!) {
        areas(searchTerm: $query, limit: 1) {
          id
          name
          country {
            name
          }
        }
      }
    `,
    {
      "query": query,
    },
  );
  if (data.areas.length === 0) {
    throw new Error(`Area not found: ${query}`);
  }

  const areaData = data.areas[0];
  return {
    id: parseInt(areaData.id),
    name: areaData.name,
    country: areaData.country.name,
  };
}

export type Resource = {
  name: string;
  url: string;
};

export type Event = Resource & {
  date: Date;
  time: [Date, Date];
  venue: Resource;
  genres: Resource[];
  artists: Resource[];
  attending: number;
  imageURLs: string[];
};

export type EventsResult = {
  events: Event[];
  total: number;
};

export async function events(areaID: number, genres: string[], page = 1): Promise<EventsResult> {
  const today = new Date();

  const data = await graphql.request(
    "https://ra.co/graphql",
    graphql.gql`
      query GET_EVENT_LISTINGS($filters: FilterInputDtoInput, $filterOptions: FilterOptionsInputDtoInput, $page: Int, $pageSize: Int, $sort: SortInputDtoInput) {
        eventListings(filters: $filters, filterOptions: $filterOptions, pageSize: $pageSize, page: $page, sort: $sort) {
          data {
            listingDate
            event {
              title
              contentUrl
              startTime
              endTime
              attending
              genres {
                name
                contentUrl
              }
              images {
                filename
                type
              }
              venue {
                name
                contentUrl
                live
              }
              artists {
                name
                contentUrl
              }
            }
          }
          totalResults
        }
      }
    `,
    {
      "filters": {
        "areas": { "eq": areaID },
        "listingDate": { "gte": `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}` },
        "genre": { "any": genres },
      },
      "filterOptions": {
        "genre": true,
        "eventType": true,
      },
      "pageSize": 50,
      "page": page,
      "sort": {
        "listingDate": { "order": "ASCENDING" },
        "score": { "order": "DESCENDING" },
        "titleKeyword": { "order": "ASCENDING" },
      },
    },
  );

  return {
    events: data.eventListings.data.map((listing) => ({
      name: listing.event.title,
      url: "https://ra.co" + listing.event.contentUrl,
      date: new Date(listing.listingDate),
      time: [new Date(listing.event.startTime), new Date(listing.event.endTime)],
      venue: {
        name: listing.event.venue.name,
        url: "https://ra.co" + listing.event.venue.contentUrl,
      },
      artists: listing.event.artists.map((artist) => ({
        name: artist.name,
        url: "https://ra.co" + artist.contentUrl,
      })),
      genres: listing.event.genres.map((genre) => ({
        name: genre.name,
        url: "https://ra.co" + genre.contentUrl,
      })),
      attending: listing.event.attending || 0,
      imageURLs: listing.event.images.map((image) => image.filename),
    } as Event)),
    total: data.eventListings.totalResults,
  };
}

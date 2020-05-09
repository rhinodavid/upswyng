import { useEffect, useState } from "react";

import { TResource } from "@upswyng/types";
import { TResourcesByCategoryPayload } from "../webTypes";
import apiClient from "../utils/apiClient";

const useResourcesByCategory = (
  categoryStub: string
): undefined | null | TResource[] => {
  const [resourcesByCategory, setResourcesByCategory] = useState<
    undefined | null | TResource[]
  >();

  useEffect(() => {
    if (categoryStub) {
      const getResourceByCategory = async (): Promise<void> => {
        try {
          const { data } = await apiClient.get<TResourcesByCategoryPayload>(
            `/category/${categoryStub}`
          );

          if (!data.category) {
            throw new Error(
              "no category found in resources by category response"
            );
          }

          const {
            category: { subcategories },
          } = data;
          if (!(subcategories || []).length) {
            throw new Error(
              "no sub-categories found in resources by category response"
            );
          }

          const uniqueResources = (subcategories || []).reduce<TResource[]>(
            (categoryResources, subcategory) => {
              const { resources: subcategoryResources } = subcategory;
              if (!subcategoryResources || !subcategoryResources.length) {
                return categoryResources;
              }

              const uniqueSubcategoryResources = categoryResources.length
                ? subcategoryResources.filter(
                    resource =>
                      !categoryResources.find(
                        categoryResource =>
                          categoryResource.resourceId === resource.resourceId
                      )
                  )
                : subcategoryResources;

              return categoryResources.concat(uniqueSubcategoryResources);
            },
            []
          );

          setResourcesByCategory(uniqueResources);
        } catch (err) {
          setResourcesByCategory(null);
          console.error(err);
        }
      };

      getResourceByCategory();
    }
  }, [categoryStub]);

  return resourcesByCategory;
};

export default useResourcesByCategory;

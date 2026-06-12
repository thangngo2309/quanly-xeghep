"use client";

import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import {
  DataGrid,
  type DataGridProps,
  type GridColDef,
  type GridPaginationModel,
  type GridRowIdGetter,
  type GridSortModel,
  type GridValidRowModel,
} from "@mui/x-data-grid";
import {
  Children,
  Fragment,
  isValidElement,
  useCallback,
  type ReactElement,
  type ReactNode,
} from "react";
import type {
  FieldValues,
  SubmitHandler,
  UseFormReturn,
} from "react-hook-form";

import { HForm } from "@/components/form";

type HDataTableProps<
  TRow extends GridValidRowModel,
  TSearch extends FieldValues = FieldValues
> = {
  title?: string;
  description?: string;

  rows: TRow[];
  columns: GridColDef<TRow>[];
  rowCount: number;
  loading?: boolean;

  getRowId?: GridRowIdGetter<TRow>;

  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;

  sortModel?: GridSortModel;
  onSortModelChange?: (model: GridSortModel) => void;

  pageSizeOptions?: number[];

  searchMethods?: UseFormReturn<TSearch>;
  onSearch?: SubmitHandler<TSearch>;
  searchContent?: ReactNode;
  onResetSearch?: () => void;

  actions?: ReactNode;
  onRefresh?: () => void;

  /**
   * Nếu không truyền height, table sẽ tự tính theo số dòng.
   * Nếu muốn cố định chiều cao thì truyền height={520}
   */
  height?: number;
  minHeight?: number;
  maxHeight?: number;

  sx?: SxProps<Theme>;
  dataGridProps?: Partial<DataGridProps<TRow>>;
};

function isSamePaginationModel(
  current: GridPaginationModel,
  next: GridPaginationModel
) {
  return current.page === next.page && current.pageSize === next.pageSize;
}

function isSameSortModel(current?: GridSortModel, next?: GridSortModel) {
  const currentItem = current?.[0];
  const nextItem = next?.[0];

  return (
    currentItem?.field === nextItem?.field &&
    currentItem?.sort === nextItem?.sort &&
    (current?.length || 0) === (next?.length || 0)
  );
}

function deferCallback(callback: () => void) {
  setTimeout(callback, 0);
}

function flattenReactChildren(children: ReactNode): ReactNode[] {
  const result: ReactNode[] = [];

  Children.forEach(children, (child) => {
    if (child === null || child === undefined || typeof child === "boolean") {
      return;
    }

    if (isValidElement(child) && child.type === Fragment) {
      const fragmentElement = child as ReactElement<{
        children?: ReactNode;
      }>;

      result.push(...flattenReactChildren(fragmentElement.props.children));
      return;
    }

    result.push(child);
  });

  return result;
}

export function HDataTable<
  TRow extends GridValidRowModel,
  TSearch extends FieldValues = FieldValues
>({
  title,
  description,

  rows,
  columns,
  rowCount,
  loading = false,

  getRowId,

  paginationModel,
  onPaginationModelChange,

  sortModel,
  onSortModelChange,

  pageSizeOptions = [10, 20, 50, 100],

  searchMethods,
  onSearch,
  searchContent,
  onResetSearch,

  actions,
  onRefresh,

  height,
  minHeight = 260,
  maxHeight = 520,

  sx,
  dataGridProps,
}: HDataTableProps<TRow, TSearch>) {
  const hasHeader = Boolean(title || description || actions || onRefresh);

  const calculatedHeight =
    height ??
    Math.min(
      maxHeight,
      Math.max(minHeight, 56 + Math.max(rows.length, 1) * 52 + 56 + 18)
    );

  function handleResetSearch() {
    if (onResetSearch) {
      onResetSearch();
      return;
    }

    searchMethods?.reset();
  }

  const handleDataGridPaginationModelChange = useCallback(
    (model: GridPaginationModel) => {
      if (isSamePaginationModel(paginationModel, model)) {
        return;
      }

      deferCallback(() => {
        onPaginationModelChange(model);
      });
    },
    [paginationModel, onPaginationModelChange]
  );

  const handleDataGridSortModelChange = useCallback(
    (model: GridSortModel) => {
      if (!onSortModelChange) {
        return;
      }

      if (isSameSortModel(sortModel, model)) {
        return;
      }

      deferCallback(() => {
        onSortModelChange(model);
      });
    },
    [sortModel, onSortModelChange]
  );

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        overflow: "hidden",
        ...sx,
      }}
    >
      {hasHeader && (
        <>
          <CardContent sx={{ py: 2 }}>
            <Stack
              spacing={2}
              sx={{
                flexDirection: {
                  xs: "column",
                  md: "row",
                },
                alignItems: {
                  xs: "stretch",
                  md: "center",
                },
                justifyContent: "space-between",
              }}
            >
              <Box>
                {title && (
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 800, fontSize: 20 }}
                  >
                    {title}
                  </Typography>
                )}

                {description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {description}
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  justifyContent: {
                    xs: "flex-start",
                    md: "flex-end",
                  },
                  flexWrap: "wrap",
                }}
              >
                {onRefresh && (
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={onRefresh}
                    disabled={loading}
                  >
                    Tải lại
                  </Button>
                )}

                {actions}
              </Box>
            </Stack>
          </CardContent>

          <Divider />
        </>
      )}

      {searchMethods && onSearch && searchContent && (
        <>
          <CardContent
            sx={{
              py: 1.5,
              px: 2,

              "& .MuiFormControl-root": {
                width: "100%",
              },

              // TextField, Select, Autocomplete dùng chung chiều cao
              "& .MuiInputBase-root": {
                minHeight: 44,
                height: 44,
                borderRadius: 2,
                fontSize: 15,
                alignItems: "center",
              },

              "& .MuiOutlinedInput-root": {
                minHeight: 44,
                height: 44,
              },

              "& .MuiOutlinedInput-input": {
                py: 0,
                height: 44,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
              },

              "& .MuiSelect-select": {
                py: "0 !important",
                height: 44,
                minHeight: "44px !important",
                display: "flex",
                alignItems: "center",
              },

              // Autocomplete input
              "& .MuiAutocomplete-root .MuiOutlinedInput-root": {
                py: "0 !important",
                minHeight: 44,
                height: 44,
                alignItems: "center",
              },

              "& .MuiAutocomplete-root .MuiOutlinedInput-input": {
                py: "0 !important",
                height: 44,
                boxSizing: "border-box",
              },

              "& .MuiAutocomplete-endAdornment": {
                top: "50%",
                transform: "translateY(-50%)",
              },

              // Label nằm giữa khi chưa shrink
              "& .MuiInputLabel-root": {
                fontSize: 14,
              },

              "& .MuiInputLabel-root:not(.MuiInputLabel-shrink)": {
                transform: "translate(14px, 12px) scale(1)",
              },

              "& .MuiInputLabel-shrink": {
                transform: "translate(14px, -9px) scale(0.75)",
              },

              "& .MuiFormHelperText-root": {
                mx: 0,
                mt: 0.5,
                fontSize: 12,
                lineHeight: 1.35,
              },

              "& .MuiInputAdornment-root": {
                height: 44,
                maxHeight: 44,
              },

              "& .MuiInputAdornment-root .MuiSvgIcon-root": {
                fontSize: 20,
              },
            }}
          >
            <HForm methods={searchMethods} onSubmit={onSearch}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
                  columnGap: 1.5,
                  rowGap: 1.5,
                  alignItems: "start",
                }}
              >
                {flattenReactChildren(searchContent).map((child, index) => (
                  <Box
                    key={index}
                    sx={{
                      gridColumn: {
                        xs: "span 12",
                        sm: "span 8",
                        md: "span 3",
                      },
                      minWidth: 0,
                    }}
                  >
                    {child}
                  </Box>
                ))}

                <Box
                  sx={{
                    gridColumn: {
                      xs: "span 12",
                      sm: "span 8",
                      md: "span 3",
                    },
                    minWidth: 0,
                    display: "flex",
                    alignItems: "center",
                    minHeight: 44,
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: "center",
                      width: "100%",
                      minHeight: 44,
                    }}
                  >
                    {onResetSearch && (
                      <Button
                        type="button"
                        variant="outlined"
                        onClick={handleResetSearch}
                        disabled={loading}
                        size="medium"
                        sx={{
                          minHeight: 44,
                          height: 44,
                          borderRadius: 2,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Xóa lọc
                      </Button>
                    )}

                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<SearchIcon />}
                      disabled={loading}
                      size="medium"
                      sx={{
                        minHeight: 44,
                        height: 44,
                        borderRadius: 2,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Tìm kiếm
                    </Button>
                  </Stack>
                </Box>
              </Box>
            </HForm>
          </CardContent>

          <Divider />
        </>
      )}

      <Box sx={{ height: calculatedHeight, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          rowCount={rowCount}
          loading={loading}
          getRowId={getRowId}
          paginationMode="server"
          sortingMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={handleDataGridPaginationModelChange}
          sortModel={sortModel}
          onSortModelChange={handleDataGridSortModelChange}
          pageSizeOptions={pageSizeOptions}
          disableRowSelectionOnClick
          density="comfortable"
          sx={{
            border: 0,
            "& .MuiDataGrid-columnHeaders": {
              bgcolor: "#f8fafc",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 800,
            },
          }}
          {...dataGridProps}
        />
      </Box>
    </Card>
  );
}
